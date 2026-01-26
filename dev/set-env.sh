#!/bin/bash

echo $VITE_API_URL >> frontend/src/.env
echo $SMTP_USER >> backend/src/.env
echo $SMTP_PASS >> backend/src/.env
echo $JWT_SECRET >> backend/src/.env
echo $TLS_LEVEL >> infra/mailserver.env
echo $ENABLE_SPAMASSASSIN >> infra/mailserver.env
echo $ENABLE_CLAMAV >> infra/mailserver.env
echo $ENABLE_FAIL2BAN >> infra/mailserver.env
echo $ONE_DIR >> infra/mailserver.env
echo $PERMIT_DOCKER >> infra/mailserver.env
echo $ENABLE_AMAVIS >> infra/mailserver.env
echo $RELAY_HOST >> infra/mailserver.env
echo $RELAY_PORT >> infra/mailserver.env
echo $RELAY_USER >> infra/mailserver.env
echo $RELAY_PASSWORD >> infra/mailserver.env
echo $ENABLE_CLAMAV >> infra/mailserver.env
echo $ENABLE_OPENDMARC >> infra/mailserver.env