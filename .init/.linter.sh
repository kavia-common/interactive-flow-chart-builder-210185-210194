#!/bin/bash
cd /home/kavia/workspace/code-generation/interactive-flow-chart-builder-210185-210194/flow_chart_frontend
npx eslint
ESLINT_EXIT_CODE=$?
npm run build
BUILD_EXIT_CODE=$?
if [ $ESLINT_EXIT_CODE -ne 0 ] || [ $BUILD_EXIT_CODE -ne 0 ]; then
   exit 1
fi

