IF NOT EXIST pyvenv (python -m venv pyvenv)
pyvenv\Scripts\pip install --upgrade --requirement=requirements.txt --retries=1
pyvenv\Scripts\it4kt-builder serve --open-browser %*
