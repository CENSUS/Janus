# builder image
FROM python:3.8 AS builder
COPY requirements.txt .
RUN pip install --user -r requirements.txt


# base image
FROM python:3.8-slim as base
COPY --from=builder /root/.local/ /root/.local
ENV PATH=/root/.local:$PATH
ENV PYTHONPYCACHEPREFIX="/tmp/.cache/cpython/"

FROM base as db_api
WORKDIR /melity
ENV PYTHONPATH=/melity
COPY db_api db_api
COPY bin bin
COPY test_data test_data
COPY run_db_api.py run.py
CMD [ "python",  "run.py",  "db_api/config/db_api.stakeholders.yaml"]