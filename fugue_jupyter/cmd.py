import argparse
import os
import subprocess
import sys


def main() -> None:
    parser = _define_args()
    t = parser.parse_args()
    if t.op == "install":
        if t.install_type == "startup":
            _install_startup(t.profile)
        if t.install_type == "nbextension":
            _install_nbextension(t.show)
    if t.op == "uninstall":
        if t.install_type == "startup":
            _uninstall_startup(t.profile)


def _define_args() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="op", required=True)
    install = subparsers.add_parser("install")
    sub_install = install.add_subparsers(dest="install_type", required=True)
    install_startup = sub_install.add_parser("startup")
    install_startup.add_argument(
        "profile", nargs="?", default="", help="IPython profile name"
    )
    install_nbextension = sub_install.add_parser("nbextension")
    install_nbextension.add_argument(
        "--show", action="store_true", help="Only show the command without execution"
    )
    uninstall = subparsers.add_parser("uninstall")
    sub_uninstall = uninstall.add_subparsers(dest="install_type", required=True)
    uninstall_startup = sub_uninstall.add_parser("startup")
    uninstall_startup.add_argument(
        "profile", nargs="?", default="", help="IPython profile name"
    )
    return parser


def _run_cmd(cmd: str, capture_stdout: bool = True) -> str:  # type: ignore
    if not capture_stdout:
        if os.system(cmd) != 0:
            sys.exit(f"Failed to run {cmd}")
    else:
        sub = subprocess.Popen(
            cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        res, err = sub.communicate()
        if sub.returncode == 0:
            return res.decode("utf-8").strip()
        sys.exit(err.decode("utf-8").strip())


def _get_startup_path(profile: str, create_dir: bool) -> str:
    cmd = "ipython profile locate"
    if profile != "":
        cmd += " '" + profile.replace("'", r"\'") + "'"
    folder = os.path.join(_run_cmd(cmd), "startup")
    if create_dir:
        os.makedirs(folder, exist_ok=True)
    return os.path.join(folder, "99-fugue-startup.py")


def _install_startup(profile: str) -> None:
    path = _get_startup_path(profile=profile, create_dir=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(
            """from fugue_jupyter import setup

setup()"""
        )
    print(f"Created {path}")


def _uninstall_startup(profile: str) -> None:
    path = _get_startup_path(profile=profile, create_dir=True)
    if os.path.exists(path):
        os.remove(path)
    print(f"Removed {path}")


def _install_nbextension(show: bool) -> None:
    cmds = [
        "jupyter nbextension install --symlink --py fugue_jupyter",
        "jupyter nbextension enable fugue_jupyter --py",
    ]
    if show:
        for cmd in cmds:
            print(cmd)
    else:
        for cmd in cmds:
            _run_cmd(cmd, capture_stdout=False)


if __name__ == "__main__":
    main()
