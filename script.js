$(function() {

	$('.validator').locationValidator({
		geonamesUsername: 'danielbeeke',
		geonamesCountry: 'NL',
		success: function(lat, lng) {
			alert(lat + ', ' + lng);
		}
        // activatedValidators: ['postcodeNL']
	});

});