#! /usr/bin/python
import pygtk
pygtk.require('2.0')
import gtk
import os
import sys
import time

def copy_image():
    clipboard = gtk.clipboard_get("CLIPBOARD")
    print "the clipboard's display is *********"
    print clipboard.get_display().get_name()
    clipboard.set_text("hello world", -1)
    clipboard.store()

def paste_image():
    clipboard = gtk.clipboard_get("CLIPBOARD")
    clipboard.request_text(handler)

def handler(arg1, str, arg3):
    print "**************"
    print str

copy_image();
time.sleep(1);
paste_image();