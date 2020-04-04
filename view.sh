#!/bin/bash
npm view $1 | grep "http" | grep "//" | grep -vE "tgz"
