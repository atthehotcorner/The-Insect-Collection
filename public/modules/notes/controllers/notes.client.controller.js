'use strict';

angular.module('notes').controller('NotesController', ['$scope', '$stateParams', 'GoogleMapApi'.ns(), '$location', 'Authentication', 'Notes', 'Insects',
	function($scope, $stateParams, $location, GoogleMapApi, Authentication, Notes, Insects) {
		$scope.authentication = Authentication;
		// Display insects on map
		$scope.map = {
			center: {
				latitude: 29.6398801,
				longitude: -82.3551082
			},
			zoom: 15,
			gmap: null,
			bounds: {},
			options: {
				scrollwheel: false,
				streetViewControl: false
			}
		};
		$scope.markers = [];

		$scope.gallerys = [];
		$scope.insects = [];

		Insects.query(function(insects) {
			for (insects.galleryName in insects) {
				var newG = {name: insects[insects.galleryName].galleryName};
				var key = insects[insects.galleryName].galleryName;
				if(newG in $scope.gallerys == false)
					$scope.gallerys.push({name : key});
			}
			for (var i = 0; i < insects.length; i++)
			{
				$scope.insects.push({latitude: insects[i].loc.coordinates[1],longitude: insects[i].loc.coordinates[0], image: insects[i].image, title: insects[i].name,location: insects[i].locationTitle});
			}
		});

		$scope.create = function() {
			var note = new Notes({
				title: this.title,
				content: this.content
			});
			note.$save(function(response) {
				$location.path('notes/' + response._id);

				$scope.title = '';
				$scope.content = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.remove = function(note) {
			if (note) {
				note.$remove();

				for (var i in $scope.notes) {
					if ($scope.notes[i] === note) {
						$scope.notes.splice(i, 1);
					}
				}
			} else {
				$scope.note.$remove(function() {
					$location.path('notes');
				});
			}
		};

		$scope.update = function() {
			var note = $scope.note;

			note.$update(function() {
				$location.path('notes/' + note._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.find = function() {

			$scope.notes = Notes.query();
		};

		$scope.findOne = function() {
			var titleThis0 = $stateParams.noteId.split(":")[1];
			var titleThis = titleThis0.substring(1,titleThis0.length-2);
			var theseInsects = [];
			Insects.query(function(insects) {
				for (var i = 0; i < insects.length; i++)
				{
					if(insects[i].galleryName == titleThis)
					{
						theseInsects.push({latitude: insects[i].loc.coordinates[1],longitude: insects[i].loc.coordinates[0], image: insects[i].image, title: insects[i].name,location: insects[i].locationTitle});
						//markersTemp.push(markers(i, insects[i]));
					}
				}
			});
			//$scope.markers = markersTemp;

			$scope.thesenotes = {
				title: titleThis,
				insectsInGal: theseInsects,
				content: "Sample note"
			};
			console.log($scope.thesenotes);

		};
	}
]);