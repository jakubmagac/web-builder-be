#!/bin/sh
if [ ! -e pyvenv ]; then
    python3 -m venv pyvenv
fi
pyvenv/bin/pip install --upgrade --requirement=requirements.txt --retries=1
pyvenv/bin/it4kt-builder serve --open-browser "$@"
