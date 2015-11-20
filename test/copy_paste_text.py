#! /usr/bin/python
import pygtk
pygtk.require('2.0')
import gtk
import os
import sys
import time

def copy_image():
    clipboard = gtk.clipboard_get(gtk.gdk.SELECTION_CLIPBOARD)
    print "the clipboard's display is *********"
    print clipboard.get_display().get_name()
    clipboard = gtk.clipboard_get(gtk.gdk.SELECTION_CLIPBOARD)
    clipboard.set_text("hello world", -1)
    clipboard.store()

def paste_image():
    clipboard = gtk.clipboard_get(gtk.gdk.SELECTION_CLIPBOARD)
    clipboard.request_text(handler)

def handler(arg1, arg2, arg3):
    print "**************"
    print arg1
    print arg2

copy_image();
time.sleep(1);
paste_image();


#! /usr/bin/python
import pygtk
pygtk.require('2.0')
import gtk
import os
import sys
import time

def copy_image():
    clipboard = gtk.clipboard_get(gtk.gdk.SELECTION_CLIPBOARD)
    clipboard.set_text("hello world")
    clipboard.store()

def paste_image():
    clipboard = gtk.clipboard_get(gtk.gdk.SELECTION_CLIPBOARD)
    clipboard.request_text(handler, -1)

def handler(arg1, buf, arg3):
    print "**************"
    print buf;

copy_image();
time.sleep(1);
paste_image();