# builder image
FROM python:3.8 AS builder
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# base image
FROM python:3.8-slim as base
COPY --from=builder /root/.local/ /root/.local
ENV PATH=/root/.local:$PATH
ENV PYTHONPYCACHEPREFIX="/tmp/.cache/cpython/"

FROM base as dbc_api
WORKDIR /melity
ENV PYTHONPATH=/melity
COPY dbc_api dbc_api
COPY run_dbc_api.py run.py
CMD [ "python", "run.py"]
