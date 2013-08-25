$(function() {

	$('.validator').locationValidator({
		geonamesUsername: 'danielbeeke',
		geonamesCountry: 'NL',
        activatedValidators: ['postcodeNL']
	});

});