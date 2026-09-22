#!/usr/bin/env python3

# Copyright Alejandro Martínez Corriá and the Thinkube contributors
# SPDX-License-Identifier: Apache-2.0

"""The reference page and the machine-readable schema agree.

Every YAML example printed under "== Examples" on the thinkube.yaml
reference page is validated against the schema attached beside it, so a
change to one that is not made in the other fails here.
"""

import json
import re
from pathlib import Path

import pytest
import yaml
from jsonschema import Draft7Validator

REPO = Path(__file__).resolve().parent.parent
PAGE = REPO / "modules/ROOT/pages/reference/thinkube-yaml.adoc"
SCHEMA = REPO / "modules/ROOT/attachments/thinkube-yaml-v1.0.schema.json"

# A titled example, then its first delimited source block.
EXAMPLE = re.compile(
    r"^=== (?P<title>.+?)\n"          # the example's heading
    r".*?"                             # any prose before the block
    r"^\[source,yaml\]\n"
    r"^----\n"
    r"(?P<body>.*?)"
    r"^----$",
    re.MULTILINE | re.DOTALL,
)


def load_schema():
    return json.loads(SCHEMA.read_text())


def page_examples():
    """Every example under the page's "== Examples" section."""
    text = PAGE.read_text()
    start = text.index("\n== Examples\n")
    end = text.index("\n== What the file does not say\n", start)
    section = text[start:end]
    found = [(m.group("title"), m.group("body")) for m in EXAMPLE.finditer(section)]
    assert found, "no examples found under == Examples"
    return found


def errors_for(document, schema=None):
    validator = Draft7Validator(schema or load_schema())
    return sorted(validator.iter_errors(document), key=lambda e: e.path)


# --- the page's own examples -------------------------------------------------


@pytest.mark.parametrize(
    "title,body", page_examples(), ids=[t for t, _ in page_examples()]
)
def test_page_example_validates(title, body):
    document = yaml.safe_load(body)
    found = errors_for(document)
    assert not found, f"{title}: " + "; ".join(e.message for e in found)


def test_examples_section_is_not_empty():
    assert len(page_examples()) >= 3


# --- the workflows service ---------------------------------------------------


def app_with(services, deployment=None):
    spec = {
        "containers": [
            {"name": "backend", "build": "./backend", "port": 8000, "health": "/health"}
        ],
        "services": services,
    }
    if deployment:
        spec["deployment"] = deployment
    return {
        "apiVersion": "thinkube.io/v1",
        "kind": "ThinkubeDeployment",
        "metadata": {"name": "wf-check"},
        "spec": spec,
    }


def test_workflows_is_an_accepted_service():
    assert not errors_for(app_with(["workflows"]))


def test_workflows_alongside_other_services():
    assert not errors_for(app_with(["database", "workflows"]))


def test_workflows_takes_no_name_suffix():
    found = errors_for(app_with(["workflows:builds"]))
    assert found, "workflows:builds should be refused; an application has one"


def test_knative_refuses_workflows():
    document = app_with(["workflows"], deployment={"type": "knative"})
    assert errors_for(document), "knative must refuse the workflows service"


def test_knative_refuses_storage():
    document = app_with(["storage"], deployment={"type": "knative"})
    assert errors_for(document), "knative must refuse the storage service"


def test_knative_still_accepts_database_cache_queue():
    document = app_with(["database", "cache", "queue"], deployment={"type": "knative"})
    assert not errors_for(document)


# --- the conditional branches fire only on the type they name ----------------


def test_an_app_without_a_deployment_block_is_not_held_to_knative_limits():
    """A file with no "deployment" key is an app, and apps have no such limits.

    The knative and component branches test spec.deployment.type. A branch
    that does not require "deployment" to be present is vacuously true for
    every file that omits it.
    """
    document = {
        "apiVersion": "thinkube.io/v1",
        "kind": "ThinkubeDeployment",
        "metadata": {"name": "demo"},
        "spec": {
            "containers": [
                {
                    "name": "backend",
                    "build": "./backend",
                    "port": 8000,
                    "health": "/health",
                    "migrations": {"tool": "alembic"},
                },
                {
                    "name": "frontend",
                    "build": "./frontend",
                    "port": 80,
                    "health": "/health",
                },
            ],
            "services": ["database", "storage", "workflows"],
        },
    }
    found = errors_for(document)
    assert not found, "; ".join(e.message for e in found)


def test_knative_limits_still_apply_when_the_type_is_knative():
    document = {
        "apiVersion": "thinkube.io/v1",
        "kind": "ThinkubeDeployment",
        "metadata": {"name": "demo"},
        "spec": {
            "deployment": {"type": "knative"},
            "containers": [
                {"name": "a", "build": ".", "port": 8080, "health": "/health"},
                {"name": "b", "build": ".", "port": 8081, "health": "/health"},
            ],
        },
    }
    assert errors_for(document), "knative allows a single container only"


def test_component_still_requires_a_name():
    document = {
        "apiVersion": "thinkube.io/v1",
        "kind": "ThinkubeDeployment",
        "metadata": {"name": "demo"},
        "spec": {
            "deployment": {"type": "component"},
            "containers": [
                {"name": "a", "build": ".", "port": 8080, "health": "/health"}
            ],
        },
    }
    assert errors_for(document), "a component must declare deployment.name"


def test_an_app_without_a_deployment_block_needs_no_component_name():
    document = {
        "apiVersion": "thinkube.io/v1",
        "kind": "ThinkubeDeployment",
        "metadata": {"name": "demo"},
        "spec": {
            "containers": [
                {"name": "a", "build": ".", "port": 8080, "health": "/health"}
            ]
        },
    }
    assert not errors_for(document)


# --- spec.deploy matches what Tandem accepts ---------------------------------
#
# Tandem reads this block through lines(), which takes one command or a list
# and yields [] when there is none. makeLive treats an empty run as "the merge
# already made it live" and still reports "at".


def repo_with(deploy=None, verify=None):
    spec = {"deployment": {"type": "none"}}
    if deploy is not None:
        spec["deploy"] = deploy
    if verify is not None:
        spec["verify"] = verify
    return {
        "apiVersion": "thinkube.io/v1",
        "kind": "ThinkubeDeployment",
        "metadata": {"name": "demo"},
        "spec": spec,
    }


def test_deploy_accepts_one_command():
    assert not errors_for(repo_with(deploy={"run": "bash scripts/deploy.sh"}))


def test_deploy_accepts_several_commands_in_order():
    assert not errors_for(repo_with(deploy={"run": ["first", "second", "third"]}))


def test_deploy_may_name_only_where_the_result_can_be_seen():
    """An app is live because it was pushed; it still says where to look."""
    document = {
        "apiVersion": "thinkube.io/v1",
        "kind": "ThinkubeDeployment",
        "metadata": {"name": "todo"},
        "spec": {
            "deployment": {"type": "app"},
            "containers": [
                {"name": "backend", "build": "./backend", "port": 8000, "health": "/health"}
            ],
            "deploy": {"at": "https://todo.thinkube.com"},
        },
    }
    found = errors_for(document)
    assert not found, "; ".join(e.message for e in found)


def test_deploy_still_refuses_an_unknown_field():
    assert errors_for(repo_with(deploy={"run": "x", "when": "friday"}))


def test_verify_still_accepts_one_command_or_several():
    assert not errors_for(repo_with(verify={"still": "make lint"}))
    assert not errors_for(repo_with(verify={"still": ["make lint", "make check"]}))


# --- gateway-managed components ----------------------------------------------


def component(**deployment):
    base = {"type": "component", "name": "vllm"}
    base.update(deployment)
    return {
        "apiVersion": "thinkube.io/v1",
        "kind": "ThinkubeDeployment",
        "metadata": {"name": "vllm"},
        "spec": {
            "deployment": base,
            "containers": [
                {"name": "server", "build": ".", "port": 8000, "health": "/health"}
            ],
        },
    }


def test_a_component_may_declare_gateway_managed():
    """thinkube-control reads this field to know that zero replicas is idle."""
    found = errors_for(component(replicas=0, gateway_managed=True))
    assert not found, "; ".join(e.message for e in found)


def test_gateway_managed_must_be_a_boolean():
    assert errors_for(component(gateway_managed="yes"))


# --- the page and the schema say the same thing ------------------------------


def test_page_lists_workflows_in_the_schema_block():
    text = PAGE.read_text()
    block = text[text.index("\n== Schema\n") : text.index("\n== metadata\n")]
    assert '"workflows"' in block


def test_page_says_knative_refuses_workflows():
    text = PAGE.read_text()
    section = text[text.index("=== Knative portability") : text.index("\n== spec.containers\n")]
    assert "workflows" in section


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
