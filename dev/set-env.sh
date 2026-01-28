#!/bin/bash

echo "Setting up environment variables..."
cat <<EOF
    TLS_LEVEL=modern
    ENABLE_SPAMASSASSIN=1
    ENABLE_CLAMAV=0
    ENABLE_FAIL2BAN=1
    ONE_DIR=1
    PERMIT_DOCKER=connected-networks
    ENABLE_AMAVIS=0
    RELAY_PORT=587
    ENABLE_CLAMAV=0
    ENABLE_OPENDMARC=1
EOF > infra/mailserver.env