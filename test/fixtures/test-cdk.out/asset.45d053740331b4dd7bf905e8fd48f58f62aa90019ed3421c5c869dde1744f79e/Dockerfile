FROM public.ecr.aws/lambda/python:3.9 as base

COPY index.py .

FROM base as test
ENTRYPOINT []
CMD ["pytest"]

FROM base as production
CMD [ "index.handle" ]