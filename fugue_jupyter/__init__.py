# flake8: noqa
import json
from pathlib import Path
from typing import Any

from fugue_jupyter_version import __version__

from .utils import NotebookSetup, setup

_HERE = Path(__file__).parent.resolve()


with (_HERE / "labextension" / "package.json").open() as fid:
    _PACKAGE_JSON = json.load(fid)


def load_ipython_extension(ip: Any) -> None:
    """Entrypoint for IPython %load_ext"""
    setup()


def _jupyter_labextension_paths():
    """Entrypoint for Jupyter Lab extension"""
    return [{"src": "labextension", "dest": _PACKAGE_JSON["name"]}]


def _jupyter_nbextension_paths():
    """Entrypoint for Jupyter Notebook extension"""
    return [
        {
            "section": "notebook",
            "src": "nbextension",
            "dest": "fugue_jupyter_notebook",
            "require": "fugue_jupyter_notebook/main",
        }
    ]
