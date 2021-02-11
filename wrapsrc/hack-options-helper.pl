#! /usr/bin/perl
# -*- coding: utf-8 -*-
# Time-stamp: "2021-02-11 18:35:47 queinnec"

use strict;
use utf8;

while ( <> ) {
    chomp;

    if ( /require.*array-helper.*[.]isArray/ ) {
        s@require\('./array-helper'\).isArray@Array.isArray@g;
    }

    print "$_\n";
}

# end of hack-options-helper.pl
