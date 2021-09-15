#! /usr/bin/perl
# -*- coding: utf-8 -*-
# Time-stamp: "2021-09-15 17:25:58 queinnec"

use strict;
use utf8;

while ( <> ) {
    chomp;

    if ( /require.*array-helper.*[.]isArray/ ) {
        s@require\('./array-helper'\).isArray@Array.isArray@g;
    }
    s@var isArray =@const isArray =@;
    s@@@g;
    s@module.exports =@export const helper =@;

    print "$_\n";
}

# end of hack-options-helper.pl
