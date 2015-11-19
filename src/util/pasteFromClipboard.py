#! /usr/bin/python
import pygtk
pygtk.require('2.0')
import gtk
import os
import sys

def handler(arg1, buf, arg3):
    print "***************"
    print str(buf.get_width())

def paste_image():
    clipboard = gtk.clipboard_get()
    clipboard.request_image(handler, '123')

paste_image()
