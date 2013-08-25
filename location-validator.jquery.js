/*!
 * jQuery location validator plugin
 * Author: @danielbeeke
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {

    var pluginName = "locationValidator",
        defaults = {
            geonamesUsername: 'danielbeeke',
            geonamesCountry: 'NL',
            geonamesLanguage: 'nl',
            html5Label: 'My device location',
            activatedValidators: ['postcodeNL', 'citiesNL', 'html5']
        };

    // Plugin constructor.
    function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            parent = this;

            // Attach clean button.
            $(parent.element).after('<a href="#" class="location-validator-clear hidden">x</a>');

            // Add clear action.
            $(parent.element).next('.location-validator-clear').click(function() {
                parent.clear();
            });

            // Init jquery ui autocomplete.
            $(parent.element).autocomplete({
                source: function(request, response) {
                    $(parent.element).addClass('validating');

                    // Show the clear button.
                    $(parent.element).next('.location-validator-clear').removeClass('hidden');

                    var autocompletions = [];

                    $.each($.fn[pluginName].validators, function(validatorName, validatorFunctions) {
                        if (jQuery.inArray(validatorName, parent.options.activatedValidators) > -1) {
                            // Validate it.
                            var validated = validatorFunctions.validate(parent);

                            // If validated run autocomplete.
                            if (validated) {
                                $.each(validatorFunctions.autocomplete(parent), function(itemIndex, item) {
                                    autocompletions.push(item);
                                });
                            }
                        }
                    });

                    // Remove validating class.
                    $(parent.element).removeClass('validating');

                    response(autocompletions);
                }
            }).data('ui-autocomplete')._renderItem = function( ul, item ) {
                var anchor = $('<li>')
                .append('<a>' + item.label)
                .appendTo(ul);

                $(anchor).click(function() {
                    if (item.action) {
                        item.action(parent);
                        parent.lock();
                    }
                    else if (item.data.lat && item.data.lng) {
                        parent.success(item.data.lat, item.data.lng);
                        parent.lock();
                    }

                });

                return anchor;
            };
        },

        clear: function() {
            parent = this;

            $(parent.element).removeAttr('disabled');
            $(parent.element).val('');
            $(parent.element).next('.location-validator-clear').addClass('hidden');
        },

        lock: function() {
            parent = this;

            $(parent.element).attr('disabled', 'disabled');
            $(parent.element).next('.location-validator-clear').removeClass('hidden');
        },

        success: function(lat, lng) {
            parent = this;

            alert(lat + ', ' + lng);
        }

    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                new Plugin( this, options ));
            }
        });
    }

    $.fn[pluginName].validators = {};

    // NL Postcode class.
    $.fn[pluginName].validators.postcodeNL = {

        validate: function(parent) {
            if ($(parent.element).val().substr(4, 1) == ' ') {
                var chars = $(parent.element).val().substr(5, 2);
                var max = 7;
            }
            else {
                var chars = $(parent.element).val().substr(4, 2);
                var max = 6;
            }

            // Only chars.
            if (! /^[a-zA-Z ]*$/.test(chars)) {
                return false;
            }

            // Not too long.
            if ($(parent.element).val().length > max) {
                return false;
            }

            var possibleNumericPart = $(parent.element).val().substr(0, 4);

            return $.isNumeric(possibleNumericPart);                
        },

        autocomplete: function(parent) {
            var numericPart = $(parent.element).val().substr(0, 4);

            var url = 'http://api.geonames.org/postalCodeSearchJSON?formatted=true&postalcode_startsWith=' + 
                numericPart + 
                '&maxRows=10&username=' + 
                parent.options.geonamesUsername + 
                '&style=full&country=' +
                parent.options.geonamesCountry +
                '&lang=' +
                parent.options.geonamesLanguage;

            var autocompletions = {};

            $.ajax({
                url: url,
                async: false
            }).done(function(data) {
                $.each(data.postalCodes, function(index, item) {
                    autocompletions[item.postalCode] = $.fn[pluginName].validators.postcodeNL.render(item);
                });
            });

            return autocompletions;
        },

        render: function(item) {
            return {
                label: '<strong>' + item.postalCode + '</strong>' + ' <em>' + item.placeName + ', ' + item.adminName2 + '</em>',
                value:  item.postalCode + ' ' + item.placeName + ', ' + item.adminName2,
                data: item
            }
        }
    };

    // NL cities class.
    $.fn[pluginName].validators.citiesNL = {
        validate: function(parent) {
            return !$.isNumeric($(parent.element).val());
        },

        autocomplete: function(parent) {
            var string = $(parent.element).val();

            var url = 'http://api.geonames.org/searchJSON?name_startsWith=' +
                string + 
                '&country=' + 
                parent.options.geonamesCountry + 
                '&featureClass=P' + 
                '&maxRows=10&username=' + 
                parent.options.geonamesUsername +
                '&lang=' +
                parent.options.geonamesLanguage;

            var autocompletions = {};

            $.ajax({
                url: url,
                async: false
            }).done(function(data) {
                $.each(data.geonames, function(index, item) {
                    autocompletions[item.geonameId] = $.fn[pluginName].validators.citiesNL.render(item);
                });
            });

            return autocompletions;
        },

        render: function(item) {
            return {
                label: '<strong>' + item.name + '</strong>' + ' <em>' + item.adminName1 + '</em>',
                value: item.name + ', ' + item.adminName1,
                data: item
            }
        }
    };


    // html5 geolocation class.
    $.fn[pluginName].validators.html5 = {
        validate: function(parent) {
            if (navigator.geolocation) {
                return true;
            }
            else {
                return false;
            }
        },

        autocomplete: function(parent) {
            return [{
                label: parent.options.html5Label,
                value: parent.options.html5Label,
                action: function(parent) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        parent.success(position.coords.latitude, position.coords.longitude);
                    });

                }
            }];
        }
    };

})( jQuery, window, document );
