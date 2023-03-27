"""
fugue_jupyter setup
"""
import json
import os
import sys
from pathlib import Path

import setuptools

HERE = Path(__file__).parent.resolve()

# Get the package info from package.json
pkg_json = json.loads((HERE / "package.json").read_bytes())

# The name of the project
name = "fugue_jupyter"

lab_path = HERE / pkg_json["jupyterlab"]["outputDir"]

# Representative files that should exist after a successful build
ensured_targets = [str(lab_path / "package.json"), str(lab_path / "static/style.js")]

labext_name = pkg_json["name"]

data_files_spec = [
    (
        "share/jupyter/labextensions/%s" % labext_name,
        str(lab_path.relative_to(HERE)),
        "**",
    ),
    ("share/jupyter/labextensions/%s" % labext_name, str("."), "install.json"),
]

long_description = (HERE / "README.md").read_text()


def get_version() -> str:
    version = (
        pkg_json["version"]
        .replace("-alpha.", "a")
        .replace("-beta.", "b")
        .replace("-rc.", "rc")
    )
    tag = os.environ.get("RELEASE_TAG", "")
    if "dev" in tag.split(".")[-1]:
        return tag
    if tag != "":
        assert tag == version, "release tag and version mismatch"
    return version


setup_args = dict(
    name=name,
    version=get_version(),
    url=pkg_json["homepage"],
    author=pkg_json["author"]["name"],
    author_email=pkg_json["author"]["email"],
    description=pkg_json["description"],
    license=pkg_json["license"],
    license_file="LICENSE",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=setuptools.find_packages(),
    install_requires=[
        "fugue>=0.8.0",
        "notebook",
        "jupyterlab>=3.0",
        "jupyterlab-lsp<4",
        "ipython>=7.10.0",
    ],
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3.7",
    platforms="Linux, Mac OS X, Windows",
    keywords=["Jupyter", "JupyterLab", "JupyterLab3"],
    classifiers=[
        "License :: OSI Approved :: BSD License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Framework :: Jupyter",
        "Framework :: Jupyter :: JupyterLab",
        "Framework :: Jupyter :: JupyterLab :: 3",
        "Framework :: Jupyter :: JupyterLab :: Extensions",
        "Framework :: Jupyter :: JupyterLab :: Extensions :: Prebuilt",
    ],
    entry_points={
        "console_scripts": ["fugue-jupyter = fugue_jupyter.cmd:main"],
        "fugue.plugins": ["jupyter = fugue_jupyter.display"],
    },
)

try:
    from jupyter_packaging import get_data_files, npm_builder, wrap_installers

    post_develop = npm_builder(
        build_cmd="install:extension", source_dir="src", build_dir=lab_path
    )
    setup_args["cmdclass"] = wrap_installers(
        post_develop=post_develop, ensured_targets=ensured_targets
    )
    setup_args["data_files"] = get_data_files(data_files_spec)
except ImportError as e:
    import logging

    logging.basicConfig(format="%(levelname)s: %(message)s")
    logging.warning(
        "Build tool `jupyter-packaging` is missing. Install it with pip or conda."
    )
    if not ("--name" in sys.argv or "--version" in sys.argv):
        raise e

if __name__ == "__main__":
    setuptools.setup(**setup_args)
