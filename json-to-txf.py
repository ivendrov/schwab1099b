#!/usr/bin/env python
"""Convert JSON file from convert-1099b-json.py to TXF for import.
See README.md for instructions on using this script.
"""

from __future__ import print_function

import datetime
import json
import sys

transactions = json.load(sys.stdin)

# TXF header:
print('V042') # Version (https://turbotax.intuit.com/txf/TXF042.jsp)
print('Aschwab1099b txf-to-json.py') # Accounting program name
print('D' + datetime.date.today().strftime('%m/%d/%Y')) # Export date
print('^') # TXF record delimiter

for transaction in transactions:
    # By using the Copy B taxrefs (711 and 713 for short-term and long-term
    # transactions, respectively), we indicate to the tax software that the
    # cost basis for these sales was *not* reported to the IRS. (This leads to
    # Box B being checked when the tax software prepares Form 8949.)
    #
    # Per the TXF specification, it's okay to always use record format 5 even
    # if no wash sale occurred, in which case we just leave the wash sale
    # amount blank ('$').

    # TXF common record fields:
    print('TD') # Type: Detail
    if (transaction['category'] == '1'):
      print('N711') # Refnum: ST gain/loss 8949 Copy B
    else:
      print('N713') # Refnum: LT gain/loss 8949 Copy B

    # TXF record format 5:
    print('P%s' % transaction['desc']) # Security
    print('D%s' % transaction['acq']) # Date acquired
    print('D%s' % transaction['sale']) # Date sold
    print('$%s' % transaction['basis']) # Cost basis
    print('$%s' % transaction['proceeds']) # Sales net
    if transaction['wash']:
        print('$%s' % transaction['wash']) # Disallowed wash sale amount
    else:
        print('$') # Disallowed wash sale amount
    print('^') # TXF record delimiter
