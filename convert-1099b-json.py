#!/usr/bin/env python
'''Convert Schwab EAC 1099 to JSON format.
See README.md for instructions on using this script.
'''

from __future__ import print_function

import sys
import json

verbose = False

if len(sys.argv) < 2:
  sys.exit('%s: <input file>...' % sys.argv[0])

short_sales = []
long_sales = []

total_shares = 0
total_proceeds = 0
total_basis = 0
total_wash = 0
total_num_records = 0

def print_and_zero_totals():
  global total_num_records, total_shares, total_proceeds, total_basis, total_wash

  print("********", file=sys.stderr)
  print("Total # records read: %d" % total_num_records, file=sys.stderr)
  print('Total shares: %.3f' % total_shares, file=sys.stderr)
  print("Verify these totals with the summary of the last page of the Schwab Statement", file=sys.stderr)
  print("Total Proceeds: $%.2f" % total_proceeds, file=sys.stderr)
  print("Total Basis: $%.2f" % total_basis, file=sys.stderr)
  print("Total Wash: $%.2f" % total_wash, file=sys.stderr)
  print("", file=sys.stderr)
  total_num_records = 0
  total_shares = 0
  total_proceeds = 0
  total_basis = 0
  total_wash = 0

input_fns = sys.argv[1:]
for fn in input_fns:
  with open(fn, 'r') as f:
    lines = [l.strip() for l in f.readlines()]
    print("Read a total of %d lines from %s " % (len(lines), fn), file=sys.stderr)

    input_line = 0
    short_term = True

    while True:
      # The input file will look something like this:
      # CUSID: 02079K305 or 38259P508 for GOOGL; 02079K107 or 38259P706 for GOOG
      # 2 SHARES OF GOOG
      # 09/19/2012 1,352.17 1,565.62
      # <W>
      # X
      # 11/28/2012 Gross <92.56>
      #
      # These fields are:
      # <CUSIP Number>
      # <Num> SHARES OF GOOG/GOOGL
      # <Acquisition Date> <Net proceeds> <Cost or other basis>
      # <wash sale disallowed>?
      # <non-covered security>
      # <Sale Date> Gross <Wash sale disallowed amount>?

      if len(lines) == input_line:
        break

      if len(lines) < input_line + 4:
        #print('WARNING: Trailing content at end of file: \n%s' % repr(lines[input_line:]), file=sys.stderr)
        break

      if not (lines[input_line].startswith('3825') or lines[input_line].startswith('0207')):
        if lines[input_line].startswith('Long-term transaction'):
          print_and_zero_totals()
          short_term = False
        input_line += 1
        continue

      if verbose:
        print("Read CUSIP: %s" % lines[input_line], file=sys.stderr)

      transaction = {}
      #description, acq_date, sale_date, proceeds, basis, wash]

      input_line += 1
      parts = lines[input_line].split(' ')
      if len(parts) != 4 or parts[1] != 'SHARES' or parts[2] != 'OF':
        sys.exit('ERROR: Parsing input line %d: %s' % (input_line+1, lines[input_line]))

      if verbose:
        print("Next line: %s" % lines[input_line], file=sys.stderr)

      quantity = float(parts[0])
      total_shares += quantity
      symbol = parts[3]
      if (symbol != 'GOOG' and symbol != 'GOOGL') or quantity <= 0:
        sys.exit('ERROR: Parsing input line %d: %s' % (input_line+1, lines[input_line]))

      transaction['desc'] = lines[input_line]

      input_line += 1
      if verbose:
        print("Next line: %s" % lines[input_line], file=sys.stderr)
      parts = lines[input_line].split(' ')
      len(parts) == 3 or sys.exit('ERROR: Parsing input line %d: %s' % (input_line+1, lines[input_line]))
      (acq_date, proceeds, basis) = parts
      proceeds = float(proceeds.replace(',', ''))
      basis = float(basis.replace(',', ''))

      transaction['acq'] = acq_date
      transaction['proceeds'] = proceeds
      transaction['basis'] = basis

      wash = False
      if lines[input_line + 1] == 'W':
        wash = True
        input_line += 1
      non_covered = ''
      if lines[input_line + 1] == 'X':
        non_covered = 'X'
        input_line += 1

      if non_covered != 'X':
        sys.exit('ERROR: Line %d. Expected to see X but instead saw: \n%s' % (input_line+1, lines[input_line]))

      input_line += 1
      if verbose:
        print("Next line: %s" % lines[input_line], file=sys.stderr)
      parts = lines[input_line].split(' ')
      len(parts) == 2 or (len(parts) == 3 and wash) or sys.exit('ERROR: Parsing input line %d: %s' % (input_line+1, lines[input_line]))
      sale_date = parts[0]
      parts[1] == 'GROSS' or sys.exit('ERROR: Expected to see GROSS line: %d' % (input_line+1))
      if wash:
        wash = parts[2]
        wash = float(wash.replace(',', ''))

      transaction['sale'] = sale_date
      transaction['wash'] = wash

      if short_term:
        transaction['category'] = '1'  # Box B - Short term noncovered
        short_sales.append(transaction)
      else:
        transaction['category'] = '4'  # Box E - Long term noncovered
        long_sales.append(transaction)

      input_line += 1

      if verbose:
        if wash:
          print("Read record: (symbol:%s,\tacq_date:%s,\tsale_date:%s,\tquantity:%.3f,\tproceeds:$%.2f,\tbasis:$%.2f,\twash:$%.2f)" % (symbol, acq_date, sale_date, quantity, proceeds, basis, wash), file=sys.stderr)
        else:
          print("Read record: (symbol:%s,\tacq_date:%s,\tsale_date:%s,\tquantity:%.3f,\tproceeds:$%.2f,\tbasis:$%.2f)" % (symbol, acq_date, sale_date, quantity, proceeds, basis), file=sys.stderr)
      total_num_records += 1

      total_proceeds += proceeds
      total_basis += basis
      if wash:
        total_wash += wash

    print_and_zero_totals()

json.dump(short_sales + long_sales, sys.stdout)

print('%d short term transaction processed' % len(short_sales), file=sys.stderr)
print('%d long term transaction processed' % len(long_sales), file=sys.stderr)
