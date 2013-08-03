"use strict";
(function(ko, CKEDITOR) {
    ko.bindingHandlers.inlineCkeditor = {
        counter: 0,
        prefix: '__cked_',
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            if (!element.id) {
                element.id = ko.bindingHandlers.inlineCkeditor.prefix + (++ko.bindingHandlers.inlineCkeditor.counter);
            }
            var options = allBindingsAccessor().ckeditorOptions || {};
            var ckUpdate = allBindingsAccessor().ckUpdate || function () { };
            var doCk = ko.utils.unwrapObservable(allBindingsAccessor().doCk) || false;
            
            if (doCk) {
                CKEDITOR = require('CKEDITOR');
                CKEDITOR.disableAutoInline = true;
                // Override the normal CKEditor save plugin

                CKEDITOR.plugins.registered['save'] =
                {
                    init: function (editor) {
                        editor.addCommand('save',
                            {
                                modes: { wysiwyg: 1, source: 1 },
                                exec: function (editor) {
                                    if (editor.checkDirty()) {
                                        var ckValue = editor.getData();
                                        ckUpdate.call(ckValue);
                                        if (ko.isWriteableObservable(valueAccessor())) {
                                            valueAccessor()(ckValue);
                                        }
                                        ckValue = null;
                                        editor.resetDirty();
                                    }
                                }
                            }
                        );
                        editor.ui.addButton('Save', { label: 'Save', command: 'save', toolbar: 'document' });
                    }
                };

                options.on = {
                    instanceReady: function (e) {
                        //hmnnn...
                    },
                    blur: function (e) {
                        if (e.editor.checkDirty()) {
                            var ckValue = e.editor.getData();
                            ckUpdate.call(ckValue);
                            var self = valueAccessor();
                            if (ko.isWriteableObservable(self)) {
                                self(ckValue);
                            }
                            ckValue = null;
                            e.editor.resetDirty();
                        }
                    }
                };

                options.extraPlugins = 'sourcedialog';
                options.removePlugins = 'sourcearea';

                CKEDITOR.inline(element, options);


                //handle destroying 
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    if (doCk) {
                        var existingEditor = CKEDITOR.instances && CKEDITOR.instances[element.id];
                        if (existingEditor) {
                            existingEditor.destroy(true);
                        }
                    }
                });
            } else {
                ko.bindingHandlers.html.init(element, valueAccessor);
            }

        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            //handle programmatic updates to the observable
            var doCk = ko.utils.unwrapObservable(allBindingsAccessor().doCk) || false;
            if (doCk) {
                var existingEditor = CKEDITOR.instances && CKEDITOR.instances[element.id];
                if (existingEditor) {
                    existingEditor.setData(ko.utils.unwrapObservable(valueAccessor()), function () {
                        this.checkDirty();  // true
                    });

                }
            } else {
                ko.bindingHandlers.html.update(element, valueAccessor);
            }
        }

    };
})(ko,CKEDITOR);
