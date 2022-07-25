# Jupyter Lab and Notebook Extensions for Fugue

The extensions enables the magic `%%fsql` and Fugue SQL highlights. It also enables pretty print of dataframes.

## Install

To install the extension, execute:

```bash
pip install fugue-jupyter
```

### Enable highlights on classic notebooks

To enable syntax highlights on classic notebooks, you will need to firstly install [jupyter-contrib-nbextensions](https://jupyter-contrib-nbextensions.readthedocs.io/en/latest/install.html) (this is NOT automatically done by installing fugue-jupyter), and then run:

```bash
fugue-jupyter install nbextension
```

Or if you want to manually install with special parameters, you can just let it show the command to be executed, you can modify them and run manually:

```bash
fugue-jupyter install nbextension --show
```

### Register startup script

For both lab and classic notebooks, you must register a startup script so the system can understand `%%fsql` means running the cell as Fugue SQL, this is separated from highlighting:

```bash
fugue-jupyter install startup
```

Or if you want to add the startup script to a specific profile (for example abc):

```bash
fugue-jupyter install startup abc
```


## Uninstall

To remove the extension, execute:

```bash
fugue-jupyter uninstall startup
pip uninstall fugue-jupyter
```
