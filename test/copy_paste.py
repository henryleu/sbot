#! /usr/bin/python
import pygtk
pygtk.require('2.0')
import gtk
import os
import sys
import time

def copy_image(f):
    assert os.path.exists(f), "file does not exist"
    image = gtk.gdk.pixbuf_new_from_file(f)

    clipboard = gtk.clipboard_get()
    clipboard.set_image(image)
    clipboard.store()

def paste_image():
    clipboard = gtk.clipboard_get()
    clipboard.request_image(handler, '123')

def handler(arg1, buf, arg3):
    print "**************"
    print buf.get_width()
    print buf.get_height()

copy_image(sys.argv[1]);
time.sleep(1);
paste_image();
