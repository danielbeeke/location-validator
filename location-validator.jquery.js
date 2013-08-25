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
            activatedValidators: ['postcodeNL', 'countryNL']
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

            // Init jquery ui autocomplete.
            $(parent.element).autocomplete({
                source: function(request, response) {
                    $(parent.element).addClass('validating');

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
                return $('<li>')
                .append('<a>' + item.label)
                .appendTo(ul);
            };
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
                parent.options.geonamesCountry;

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
                value: item.postalCode
            }
        }
    };

    // NL country class.
    $.fn[pluginName].validators.countryNL = {
        validate: function(parent) {
            return !$.isNumeric($(parent.element).val());
        }
    };

})( jQuery, window, document );
