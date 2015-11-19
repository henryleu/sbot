#! /usr/bin/python
import pygtk
pygtk.require('2.0')
import gtk
import os
import sys
import time

def paste_image():
clipboard = gtk.clipboard_get()
clipboard.request_image(handler, '123')

def handler(arg1, buf, arg3):
print str(buf.get_width())

paste_image();
