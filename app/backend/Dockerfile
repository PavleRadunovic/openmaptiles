FROM ubuntu:latest
FROM python:3.7-stretch
WORKDIR /project
ADD . /project
RUN pip install -r requirements.txt
EXPOSE 5000

ENTRYPOINT ["gunicorn", "-b", "0.0.0.0:5000", "-w", "9", "app:app"]

