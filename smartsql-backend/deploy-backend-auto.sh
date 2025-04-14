#!/bin/bash

gcloud builds submit \
  --tag us-west2-docker.pkg.dev/db-group2-cs5200-25spring/backend-repo/smartsql-backend


gcloud run deploy smartsql-backend \
  --image us-west2-docker.pkg.dev/db-group2-cs5200-25spring/backend-repo/smartsql-backend \
  --platform managed \
  --region us-west2 \
  --allow-unauthenticated \
  --add-cloudsql-instances=cs5200-database-yiling:us-west2:cs5200-database-yiling-lab9 \
  --set-secrets=ENV_FILE=django-env:latest
