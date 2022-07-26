.PHONY: help clean dev docs package test

help:
	@echo "The following make targets are available:"
	@echo "	 devenv		create venv and install all deps for dev env (assumes python3 cmd exists)"
	@echo "	 dev 		install all deps for dev env (assumes venv is present)"
	@echo "  docs		create pydocs for all relveant modules (assumes venv is present)"
	@echo "	 package	package for pypi"
	@echo "	 test		run all tests with coverage (assumes venv is present)"

devenv:
	pip3 install -r requirements.txt
	pre-commit install

dev:
	pip3 install -r requirements.txt

lab:
	mkdir -p tmp
	pip uninstall -y fugue-jupyter
	jupyter labextension develop --overwrite .
	jlpm run build
	fugue-jupyter install startup
	jupyter lab --port=8888 --ip=0.0.0.0 --no-browser --allow-root --NotebookApp.token='' --NotebookApp.password='' --NotebookApp.allow_origin='*'

nb:
	mkdir -p tmp
	pip uninstall -y fugue-jupyter
	jupyter labextension develop --overwrite .
	jlpm run build
	jupyter nbextension uninstall --py fugue_jupyter
	fugue-jupyter install nbextension
	fugue-jupyter install startup
	jupyter notebook --port=8888 --ip=0.0.0.0 --no-browser --allow-root --NotebookApp.token='' --NotebookApp.password='' --NotebookApp.allow_origin='*'

docs:
	rm -rf docs/api
	rm -rf docs/build
	sphinx-apidoc --no-toc -f -t=docs/_templates -o docs/api triad/
	sphinx-build -b html docs/ docs/build/

lint:
	pre-commit run --all-files

package:
	jlpm
	jlpm run build
	rm -rf dist/*
	python -m build --sdist
	python -m build --wheel

test:
	python3 -bb -m pytest tests/

testnb:
	fugue-jupyter install startup
	jupyter nbconvert --execute --clear-output tests/fugue_jupyter/test_notebook.ipynb
