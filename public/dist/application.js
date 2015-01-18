'use strict';
// Init the application configuration module for AngularJS application
var ApplicationConfiguration = function () {
    // Init module configuration options
    var applicationModuleName = 'theInsectCollection';
    var applicationModuleVendorDependencies = [
        'ngResource',
        'ngCookies',
        'ngAnimate',
        'ngTouch',
        'ngSanitize',
        'ui.router',
        'ui.bootstrap',
        'ui.utils',
        'google-maps'.ns(),
        'angularFileUpload',
        'ui.tinymce'
      ];
    // Add a new vertical module
    var registerModule = function (moduleName, dependencies) {
      // Create angular module
      angular.module(moduleName, dependencies || []);
      // Add the module to the AngularJS configuration file
      angular.module(applicationModuleName).requires.push(moduleName);
    };
    return {
      applicationModuleName: applicationModuleName,
      applicationModuleVendorDependencies: applicationModuleVendorDependencies,
      registerModule: registerModule
    };
  }();'use strict';
//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);
// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config([
  '$locationProvider',
  function ($locationProvider) {
    $locationProvider.hashPrefix('!');
  }
]);
// Setting Google Maps Dependencies
angular.module(ApplicationConfiguration.applicationModuleName).config([
  'GoogleMapApiProvider'.ns(),
  function (GoogleMapApi) {
    GoogleMapApi.configure({
      v: '3.17',
      libraries: 'weather,geometry,visualization'
    });
  }
]);
//Then define the init function for starting up the application
angular.element(document).ready(function () {
  //Fixing facebook bug with redirect
  if (window.location.hash === '#_=_')
    window.location.hash = '#!';
  //Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('collections');'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('groups');'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('insects');'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('notes');'use strict';
// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users');'use strict';
// Configuring the Collections module
angular.module('collections').run([
  'Menus',
  function (Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Collections', 'collections', 'dropdown', '/collections(/create)?');
    Menus.addSubMenuItem('topbar', 'collections', 'List Collections', 'collections', null, true, null, null, 'See everyone\'s collections');
    Menus.addSubMenuItem('topbar', 'collections', 'New Collection', 'collections/create', null, false, null, null, 'Create a virtual insect collection.');
  }
]);'use strict';
// Setting up route
angular.module('collections').config([
  '$stateProvider',
  function ($stateProvider) {
    // Collections state routing
    $stateProvider.state('listCollections', {
      url: '/collections',
      templateUrl: 'modules/collections/views/list-collections.client.view.html'
    }).state('createCollection', {
      url: '/collections/create',
      templateUrl: 'modules/collections/views/create-collection.client.view.html'
    }).state('viewCollection', {
      url: '/collections/:collectionId',
      templateUrl: 'modules/collections/views/view-collection.client.view.html'
    }).state('editCollection', {
      url: '/collections/:collectionId/edit',
      templateUrl: 'modules/collections/views/edit-collection.client.view.html'
    });
  }
]);'use strict';
angular.module('collections').controller('CollectionsController', [
  '$state',
  '$scope',
  '$http',
  '$stateParams',
  '$location',
  'Authentication',
  'Collections',
  'Insects',
  function ($state, $scope, $http, $stateParams, $location, Authentication, Collections, Insects) {
    $scope.authentication = Authentication;
    $scope.createPage = function () {
      // If user is not signed in then redirect back
      if (!$scope.authentication.user)
        $location.path('/collections');
      $scope.loading = true;
      $scope.commentsEnabled = true;
      $scope.insects = [];
      $scope.selectedInsects = [];
      $scope.insects = Insects.query({ limit: 100 }, function () {
        $scope.loading = false;
      });
      $scope.addInsect = function () {
        var insectId = this.insect._id;
        var index = $scope.selectedInsects.indexOf(insectId);
        if (index === -1)
          $scope.selectedInsects.push(insectId);
        else
          $scope.selectedInsects.splice(index, 1);
      };
    };
    $scope.create = function () {
      var collection = new Collections({
          name: this.name,
          description: this.description,
          caught: $scope.selectedInsects
        });
      collection.$save(function (response) {
        $location.path('collections/' + response._id);
        $scope.name = '';
        $scope.description = '';
        $scope.selectedInsects = [];
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    $scope.remove = function (collection) {
      if (collection) {
        collection.$remove();
        for (var i in $scope.collections) {
          if ($scope.collections[i] === collection) {
            $scope.collections.splice(i, 1);
          }
        }
      } else {
        $scope.collection.$remove(function () {
          $location.path('collections');
        });
      }
    };
    $scope.updatePage = function () {
      // If user is not signed in then redirect back
      if (!$scope.authentication.user)
        $location.path('/collections');
      $scope.loading = true;
      $scope.insectModel = {};
      $scope.insects = [];
      $scope.selectedInsects = [];
      $scope.addInsect = function (insect) {
        var index = $scope.selectedInsects.indexOf(insect._id);
        if (index === -1)
          $scope.selectedInsects.push(insect._id);
        else
          $scope.selectedInsects.splice(index, 1);
      };
      $scope.collection = Collections.get({ collectionId: $stateParams.collectionId }, function () {
        for (var i = 0; i < $scope.collection.caught.length; i++) {
          $scope.selectedInsects.push($scope.collection.caught[i]._id);
          $scope.insectModel[$scope.collection.caught[i]._id] = true;
        }
        $scope.insects = Insects.query({ limit: 100 }, function () {
          $scope.loading = false;
        });
      });
    };
    $scope.update = function () {
      var collection = new Collections({
          _id: $scope.collection._id,
          name: $scope.collection.name,
          description: $scope.collection.description,
          commentsEnabled: $scope.collection.commentsEnabled,
          caught: $scope.selectedInsects
        });
      collection.$update(function () {
        $location.path('collections/' + collection._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    $scope.find = function () {
      $scope.loading = true;
      $scope.collections = Collections.query(function () {
        $scope.loading = false;
      });
    };
    $scope.findOne = function () {
      $scope.loading = true;
      $scope.collection = Collections.get({ collectionId: $stateParams.collectionId }, function () {
        $scope.loading = false;
      });
      // comments
      $scope.comment = {
        content: '',
        add: function () {
          $http.post('/collections/' + $scope.collection._id + '/comment/', { content: $scope.comment.content }).success(function (data, status, headers, config) {
            $state.go($state.$current, null, { reload: true });
          }).error(function (data, status, headers, config) {
            $scope.comment.error = data.message;
          });
        }
      };
    };
  }
]);'use strict';
//Collections service used for communicating with the collections REST endpoints
angular.module('collections').factory('Collections', [
  '$resource',
  function ($resource) {
    return $resource('collections/:collectionId', { collectionId: '@_id' }, { update: { method: 'PUT' } });
  }
]);'use strict';
// Setting up route
angular.module('core').config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    // Redirect to home view when route not found
    $urlRouterProvider.otherwise('/');
    // Home state routing
    $stateProvider.state('home', {
      url: '/',
      templateUrl: 'modules/core/views/home.client.view.html'
    });
  }
]);'use strict';
angular.module('core').controller('HeaderController', [
  '$scope',
  'Authentication',
  'Menus',
  function ($scope, Authentication, Menus) {
    $scope.authentication = Authentication;
    $scope.isCollapsed = false;
    $scope.menu = Menus.getMenu('topbar');
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };
    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });
  }
]);'use strict';
angular.module('core').controller('HomeController', [
  '$scope',
  '$location',
  'Insects',
  'GoogleMapApi'.ns(),
  'Authentication',
  function ($scope, $location, Insects, GoogleMapApi, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    // Number of insects counter
    Insects.get({ count: 1 }, function (data) {
      $scope.totalInsects = data.count;
    });
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
    // Ready to manipulate map
    GoogleMapApi.then(function (maps) {
      var markersTemp = [];
      var markers = function (i, insect) {
        var marker = {
            id: insect._id,
            latitude: insect.loc.coordinates[1],
            longitude: insect.loc.coordinates[0],
            options: {
              icon: {
                url: insect.image.small,
                scaledSize: new google.maps.Size(50, 50)
              }
            },
            name: insect.name,
            scientificName: insect.scientificName,
            user: insect.user,
            dateFound: insect.dateFound,
            locationTitle: insect.locationTitle
          };
        return marker;
      };
      Insects.query({ limit: 10 }, function (insects) {
        for (var i = 0; i < insects.length; i++) {
          markersTemp.push(markers(i, insects[i]));
        }
      });
      $scope.markers = markersTemp;
    });
  }
]);'use strict';
//Menu service used for managing  menus
angular.module('core').service('Menus', [function () {
    // Define a set of default roles
    this.defaultRoles = ['*'];
    // Define the menus object
    this.menus = {};
    // A private function for rendering decision
    var shouldRender = function (user) {
      if (user) {
        if (!!~this.roles.indexOf('*')) {
          return true;
        } else {
          for (var userRoleIndex in user.roles) {
            for (var roleIndex in this.roles) {
              if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
                return true;
              }
            }
          }
        }
      } else {
        return this.isPublic;
      }
      return false;
    };
    // Validate menu existance
    this.validateMenuExistance = function (menuId) {
      if (menuId && menuId.length) {
        if (this.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exists');
        }
      } else {
        throw new Error('MenuId was not provided');
      }
      return false;
    };
    // Get the menu object by menu id
    this.getMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Return the menu object
      return this.menus[menuId];
    };
    // Add new menu object by menu id
    this.addMenu = function (menuId, isPublic, roles) {
      // Create the new menu
      this.menus[menuId] = {
        isPublic: isPublic || false,
        roles: roles || this.defaultRoles,
        items: [],
        shouldRender: shouldRender
      };
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Return the menu object
      delete this.menus[menuId];
    };
    // Add menu item object
    this.addMenuItem = function (menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position, hilit) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Push new menu item
      this.menus[menuId].items.push({
        title: menuItemTitle,
        link: menuItemURL,
        menuItemType: menuItemType || 'item',
        menuItemClass: menuItemType,
        uiRoute: menuItemUIRoute || '/' + menuItemURL,
        isPublic: isPublic === null || typeof isPublic === 'undefined' ? this.menus[menuId].isPublic : isPublic,
        roles: roles === null || typeof roles === 'undefined' ? this.menus[menuId].roles : roles,
        position: position || 0,
        items: [],
        shouldRender: shouldRender,
        hilight: hilit
      });
      // Return the menu object
      return this.menus[menuId];
    };
    // Add submenu item object
    this.addSubMenuItem = function (menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position, hilit) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
          // Push new submenu item
          this.menus[menuId].items[itemIndex].items.push({
            title: menuItemTitle,
            link: menuItemURL,
            uiRoute: menuItemUIRoute || '/' + menuItemURL,
            isPublic: isPublic === null || typeof isPublic === 'undefined' ? this.menus[menuId].items[itemIndex].isPublic : isPublic,
            roles: roles === null || typeof roles === 'undefined' ? this.menus[menuId].items[itemIndex].roles : roles,
            position: position || 0,
            shouldRender: shouldRender,
            hilight: hilit
          });
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeMenuItem = function (menuId, menuItemURL) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
          this.menus[menuId].items.splice(itemIndex, 1);
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    // Remove existing menu object by menu id
    this.removeSubMenuItem = function (menuId, submenuItemURL) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);
      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
          if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
            this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }
      // Return the menu object
      return this.menus[menuId];
    };
    //Adding the topbar menu
    this.addMenu('topbar', true, null);
  }]);'use strict';
// Configuring the Groups module
angular.module('groups').run([
  'Menus',
  function (Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Groups & Classes', 'groups', 'dropdown', '(/groups(/classes)?||/groups(/create)?)', false, null, 9, 'test');
    Menus.addSubMenuItem('topbar', 'groups', 'List Groups', 'groups', null, true, null, null, 'View all groups.');
    Menus.addSubMenuItem('topbar', 'groups', 'List Classes', 'groups/classes', null, true, null, null, 'View all classes.');
    Menus.addSubMenuItem('topbar', 'groups', 'New Group', 'groups/create', null, true, null, null, 'Create a group for collabration.');
  }
]);'use strict';
// Setting up route
angular.module('groups').config([
  '$stateProvider',
  function ($stateProvider) {
    // Groups state routing
    $stateProvider.state('listGroups', {
      url: '/groups',
      templateUrl: 'modules/groups/views/list-groups.client.view.html'
    }).state('listClasses', {
      url: '/groups/classes',
      templateUrl: 'modules/groups/views/list-classes.client.view.html'
    }).state('createGroup', {
      url: '/groups/create',
      templateUrl: 'modules/groups/views/create-group.client.view.html'
    }).state('viewGroup', {
      url: '/groups/:groupId',
      templateUrl: 'modules/groups/views/view-group.client.view.html'
    }).state('editGroup', {
      url: '/groups/:groupId/edit',
      templateUrl: 'modules/groups/views/edit-group.client.view.html'
    });
  }
]);'use strict';
angular.module('groups').controller('GroupsController', [
  '$scope',
  '$http',
  '$stateParams',
  '$location',
  'Authentication',
  'Groups',
  'Insects',
  function ($scope, $http, $stateParams, $location, Authentication, Groups, Insects) {
    $scope.authentication = Authentication;
    $scope.create = function () {
      var group = new Groups({
          name: this.name,
          description: this.description,
          type: this.type
        });
      group.$save(function (response) {
        $location.path('groups/' + response._id);
        $scope.name = '';
        $scope.description = '';
        $scope.type = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    $scope.remove = function (group) {
      if (group) {
        group.$remove();
        for (var i in $scope.groups) {
          if ($scope.groups[i] === group) {
            $scope.groups.splice(i, 1);
          }
        }
      } else {
        $scope.group.$remove(function () {
          $location.path('groups');
        });
      }
    };
    $scope.update = function () {
      var group = $scope.group;
      group.$update(function () {
        $location.path('groups/' + group._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    $scope.findGroup = function () {
      $scope.loading = true;
      $scope.groups = Groups.query({ type: 'Group' }, function () {
        $scope.loading = false;
      }, function (err) {
        $scope.loading = false;
        $scope.error = err.data.message;
      });
    };
    $scope.findClass = function () {
      $scope.loading = true;
      $scope.groups = Groups.query({ type: 'Class' }, function () {
        $scope.loading = false;
      }, function (err) {
        $scope.loading = false;
        $scope.error = err.data.message;
      });
    };
    $scope.findOne = function () {
      $scope.loading = true;
      Groups.get({ groupId: $stateParams.groupId }, function (data) {
        $scope.loading = false;
        $scope.group = data.data;
        $scope.membersList = data.membersList;
        $scope.insects = data.insects;
        $scope.collections = data.collections;
      }, function (err) {
        $scope.loading = false;
        $scope.error = err.data.message;
      });
    };
    $scope.addMember = function () {
      var group = $scope.group;
      group.members.push(this.member);
      group.$update(function () {
        $location.path('groups/' + group._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    $scope.joinGroup = function () {
      var group = $scope.group;
      var isMember = false;
      for (var i = 0; i < group.members.length; i++) {
        if (group.members[i]._id === $scope.authentication.user._id)
          isMember = true;
      }
      if (!isMember)
        group.members.push($scope.authentication.user);
      group.$joinGroup(function () {
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    $scope.find2 = function () {
      var slides = $scope.slides = [10];
      $scope.insects = Insects.query();
    };
    $scope.leaveGroup = function () {
      var group = $scope.group;
      for (var i = 0; i < group.members.length; i++) {
        if (group.members[i]._id === $scope.authentication.user._id)
          group.members.splice(i, 1);
      }
      group.$joinGroup(function () {
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    $scope.showPath = function (path) {
      $location.path(path);
    };
  }
]);'use strict';
//Groups service used for communicating with the groups REST endpoints
angular.module('groups').factory('Groups', [
  '$resource',
  function ($resource) {
    return $resource('groups/:groupId', { groupId: '@_id' }, {
      joinGroup: { method: 'POST' },
      update: { method: 'PUT' }
    });
  }
]);'use strict';
// Configuring the Insects module
angular.module('insects').run([
  'Menus',
  function (Menus) {
    // Set top bar menu items
    // menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position
    Menus.addMenuItem('topbar', 'Insects', 'insects', 'dropdown', '/insects(/create)?', true, null, -1);
    Menus.addSubMenuItem('topbar', 'insects', 'All Insects', 'insects', null, true, null, null, 'See everyone\'s insects.');
    Menus.addSubMenuItem('topbar', 'insects', 'View Map', 'insects/map', null, true, null, null, 'Look around to see where insects were caught.');
    // menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position
    Menus.addSubMenuItem('topbar', 'insects', 'New Insect', 'insects/create', null, false, null, null, 'Create your insect.');
  }
]);'use strict';
// Setting up route
angular.module('insects').config([
  '$stateProvider',
  function ($stateProvider) {
    // Insects state routing
    $stateProvider.state('listInsects', {
      url: '/insects',
      templateUrl: 'modules/insects/views/list-insects.client.view.html'
    }).state('listInsectsSkip', {
      url: '/insects/skip/:skip',
      templateUrl: 'modules/insects/views/list-insects.client.view.html'
    }).state('listInsectsOfUser', {
      url: '/insects/user/:userId',
      templateUrl: 'modules/insects/views/list-insects.client.view.html'
    }).state('listInsectsOfUserSkip', {
      url: '/insects/user/:userId/skip/:skip',
      templateUrl: 'modules/insects/views/list-insects.client.view.html'
    }).state('createInsect', {
      url: '/insects/create',
      templateUrl: 'modules/insects/views/create-insect.client.view.html'
    }).state('viewMap', {
      url: '/insects/map',
      templateUrl: 'modules/insects/views/view-map.client.view.html'
    }).state('viewMapOfUser', {
      url: '/insects/map/user/:userId',
      templateUrl: 'modules/insects/views/view-map.client.view.html'
    }).state('viewInsect', {
      url: '/insects/:insectsId',
      templateUrl: 'modules/insects/views/view-insect.client.view.html'
    }).state('editInsect', {
      url: '/insects/:insectsId/edit',
      templateUrl: 'modules/insects/views/edit-insect.client.view.html'
    });
  }
]);'use strict';
angular.module('insects').controller('InsectsController', [
  '$state',
  '$scope',
  '$http',
  '$upload',
  '$stateParams',
  '$location',
  'Authentication',
  'Insects',
  'GoogleMapApi'.ns(),
  function ($state, $scope, $http, $upload, $stateParams, $location, Authentication, Insects, GoogleMapApi) {
    $scope.authentication = Authentication;
    $scope.createPage = function () {
      // If user is not signed in then redirect back
      if (!$scope.authentication.user)
        $location.path('/insects');
      $scope.form = {
        loc: {
          coordinates: {
            latitude: '',
            longitude: ''
          }
        },
        commentsEnabled: true,
        validationEnabled: true,
        dateFound: new Date(),
        isValid: false,
        reviewForm: false,
        uploadingForm: false,
        progress: {
          current: 0,
          max: 100,
          type: 'info',
          task: 'Uploading',
          active: true
        },
        coordsSet: false,
        cancel: function () {
          $location.path('insects');
        },
        reset: function () {
          $scope.form.progress.current = 0;
          $scope.form.reviewForm = false;
          $scope.form.uploadingForm = false;
          $scope.form.progress.active = true;
          $scope.form.progress.task = 'Uploading';
        }
      };
      // Map on create insect page
      $scope.map = {
        center: {
          latitude: 29.6398801,
          longitude: -82.3551082
        },
        zoom: 15,
        moveMarker: null,
        gmap: {},
        bounds: {},
        options: {
          scrollwheel: true,
          streetViewControl: false
        }
      };
      $scope.marker = {
        id: 0,
        coords: {
          latitude: 29.6398801,
          longitude: -82.3551082
        },
        options: { draggable: true },
        events: {
          dragend: function (marker, eventName, args) {
            $scope.$apply(function () {
              $scope.form.loc.coordinates.latitude = marker.getPosition().lat();
              $scope.form.loc.coordinates.longitude = marker.getPosition().lng();
              $scope.form.coordsSet = true;
            });
          }
        }
      };
      // Datepicker
      $scope.datePicker = {
        options: {
          formatYear: 'yyyy',
          startingDay: 0
        },
        format: 'MMMM d, yyyy',
        minDate: null,
        maxDate: new Date(),
        clear: function () {
          $scope.dt = null;
        },
        open: function ($event) {
          $event.preventDefault();
          $event.stopPropagation();
          $scope.datePicker.opened = true;
        }
      };
    };
    $scope.create = function () {
      // Enable progress bar
      $scope.form.reviewForm = false;
      $scope.form.uploadingForm = true;
      $scope.form.progress.type = 'info';
      var insect = new Insects({
          name: this.form.name,
          galleryName: this.form.galleryName,
          scientificName: this.form.scientificName,
          description: this.form.description,
          dateFound: this.form.dateFound,
          commentsEnabled: this.form.commentsEnabled,
          validationEnabled: this.form.validationEnabled,
          locationTitle: this.form.locationTitle,
          loc: {
            coordinates: [
              this.form.loc.coordinates.longitude,
              this.form.loc.coordinates.latitude
            ]
          }
        });
      $upload.upload({
        url: '/insects',
        method: 'POST',
        file: this.form.image,
        data: insect
      }).progress(function (evt) {
        $scope.form.progress.current = parseInt(75 * evt.loaded / evt.total, 10);
        if ($scope.form.progress.current === 75)
          $scope.form.progress.task = 'Processing';
      }).success(function (response, status, headers, config) {
        $scope.form.progress.current = 100;
        $location.path('insects/' + response._id);
        // clear form if they make new insect
        $scope.form.name = '';
        $scope.form.galleryName = '';
        $scope.form.scientificName = '';
        $scope.form.description = '';
        $scope.form.dateCreated = new Date();
        $scope.form.commentsEnabled = true;
        $scope.form.validationEnabled = true;
        $scope.form.locationTitle = '';
        $scope.form.loc.coordinates.latitude = '';
        $scope.form.loc.coordinates.longitude = '';
        $scope.form.image = '';
        $scope.form.isValid = false;
        $scope.form.reviewForm = false;
        $scope.form.uploadingForm = false;
        $scope.form.progress.current = 0;
        $scope.form.progress.type = 'success';
        $scope.form.coordsSet = false;
      }).error(function (data, status, headers, config) {
        $scope.error = data.message;
        $scope.form.progress.active = false;
        $scope.form.progress.type = 'warning';
      });
    };
    $scope.remove = function (insect) {
      if (insect) {
        insect.$remove();
        for (var i in $scope.insects) {
          if ($scope.insects[i] === insect) {
            $scope.insects.splice(i, 1);
          }
        }
      } else {
        $scope.insect.$remove(function () {
          $location.path('insects');
        });
      }
    };
    // List Insects Pages
    $scope.find = function () {
      $scope.loading = true;
      // Skip insects for pagination
      var skip = 0;
      if ($stateParams.hasOwnProperty('skip') && parseInt($stateParams.skip, 10) >= 0)
        skip = parseInt($stateParams.skip, 10);
      function fetch(skip, firstRun) {
        $scope.loading = true;
        // If finding a user's insects
        if ($stateParams.hasOwnProperty('userId')) {
          //if (skip == 0) $location.path('insects/user/' + $stateParams.userId, false);
          //else $location.path('insects/user/' + $stateParams.userId + '/skip/' + skip, false);
          $scope.insects = Insects.query({
            userId: $stateParams.userId,
            skip: skip
          }, function () {
            $scope.loading = false;
          });
          // Get total count
          Insects.get({
            userId: $stateParams.userId,
            count: 1
          }, function (data) {
            $scope.foundUser = data.user;
            $scope.pagination.totalItems = data.count;
          });
        }  // List all insects
        else {
          //if (skip == 0) $location.path('insects', false);
          //else $location.path('insects/skip/' + skip, false);
          $scope.insects = Insects.query({
            limit: 12,
            skip: skip
          }, function () {
            $scope.loading = false;
          });
          // Get total count
          Insects.get({ count: 1 }, function (data) {
            $scope.count = data;
            $scope.pagination.totalItems = data.count;
            if (firstRun)
              $scope.pagination.currentPage = parseInt(skip / data.count * 12, 10);
          });
        }
      }
      fetch(skip, true);
      $scope.pagination = {
        totalItems: 0,
        currentPage: 0,
        itemsPerPage: 12,
        pageChanged: function (page) {
          fetch(($scope.pagination.currentPage - 1) * 12);
        }
      };
    };
    // View Insect Page
    $scope.findOne = function () {
      $scope.loading = true;
      $scope.insect = Insects.get({ insectId: $stateParams.insectsId }, function (insect) {
        $scope.insectMap = {
          center: {
            latitude: insect.loc.coordinates[1],
            longitude: insect.loc.coordinates[0]
          },
          zoom: 15,
          bounds: {},
          options: {
            scrollwheel: true,
            streetViewControl: false
          }
        };
        $scope.insectMarker = {
          id: 0,
          coords: {
            latitude: insect.loc.coordinates[1],
            longitude: insect.loc.coordinates[0]
          },
          options: { draggable: false }
        };
        $scope.loading = false;
      }, function (errorResponse) {
        //$scope.error = errorResponse.data.message;
        $scope.insect404 = true;
        $scope.loading = false;
      });
      $scope.insectDownload = function (size) {
        $http.get('/insects/' + $scope.insect._id + '/download/' + size).success(function (data, status, headers, config) {
          window.open(data);  //document.location.href = data;
        }).error(function (data, status, headers, config) {
          $scope.error = data.message;
        });
      };
      $scope.generatePDF = function () {
        var docDefinition = {
            content: [
              {
                text: 'Insect Guide',
                style: 'header'
              },
              {
                style: 'table',
                table: {
                  widths: [
                    200,
                    '*'
                  ],
                  body: [
                    [
                      {
                        text: 'Photo',
                        style: 'tableHeader'
                      },
                      {
                        text: 'Infomation',
                        style: 'tableHeader'
                      }
                    ],
                    [
                      {
                        image: $scope.insect.image.large,
                        width: 200
                      },
                      {
                        table: {
                          body: [
                            [
                              {
                                text: 'Name',
                                bold: true
                              },
                              $scope.insect.name
                            ],
                            [
                              {
                                text: 'Scientific Name',
                                bold: true
                              },
                              $scope.insect.scientificName
                            ],
                            [
                              {
                                text: 'Description',
                                bold: true
                              },
                              $scope.insect.description
                            ],
                            [
                              {
                                text: 'Caught By',
                                bold: true
                              },
                              $scope.insect.user.displayName
                            ],
                            [
                              {
                                text: 'Date Found',
                                bold: true
                              },
                              $scope.insect.dateFound
                            ],
                            [
                              {
                                text: 'Location Found',
                                bold: true
                              },
                              $scope.insect.locationTitle
                            ],
                            [
                              {
                                text: 'Coordinates',
                                bold: true
                              },
                              $scope.insect.loc.coordinates[0] + ', ' + $scope.insect.loc.coordinates[1]
                            ]
                          ]
                        },
                        layout: 'noBorders'
                      }
                    ]
                  ]
                },
                layout: 'lightHorizontalLines'
              }
            ],
            styles: {
              header: {
                fontSize: 18,
                bold: true,
                margin: [
                  0,
                  0,
                  0,
                  10
                ]
              },
              subheader: {
                fontSize: 16,
                bold: true,
                margin: [
                  0,
                  10,
                  0,
                  5
                ]
              },
              table: {
                margin: [
                  0,
                  5,
                  0,
                  15
                ]
              },
              tableHeader: {
                bold: true,
                fontSize: 13,
                color: 'black'
              }
            }
          };
        // Open PDF
        pdfMake.createPdf(docDefinition).download();
      };
      // comments
      $scope.comment = {
        content: '',
        add: function () {
          $http.post('/insects/' + $scope.insect._id + '/comment/', { content: $scope.comment.content }).success(function (data, status, headers, config) {
            $state.go($state.$current, null, { reload: true });
          }).error(function (data, status, headers, config) {
            $scope.comment.error = data.message;
          });
        }
      };
    };
    // Edit Insect Page
    $scope.findOneEdit = function () {
      $scope.insect = Insects.get({ insectId: $stateParams.insectsId });
    };
    // Update insect
    $scope.update = function () {
      var insect = new Insects({
          _id: $scope.insect._id,
          name: $scope.insect.name,
          scientificName: $scope.insect.scientificName,
          description: $scope.insect.description,
          commentsEnabled: $scope.insect.commentsEnabled,
          locationTitle: $scope.insect.locationTitle
        });
      insect.$update(function () {
        $location.path('insects/' + insect._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    // Map Page
    $scope.map = function () {
      // If finding a user's insects
      if ($stateParams.hasOwnProperty('userId')) {
        // Get total count
        Insects.get({
          userId: $stateParams.userId,
          count: 1
        }, function (data) {
          $scope.foundUser = data.user;
        });
      }
      // Display insects on map
      $scope.map = {
        center: {
          latitude: 29.6398801,
          longitude: -82.3551082
        },
        zoom: 16,
        gmap: null,
        bounds: {},
        options: {
          scrollwheel: true,
          streetViewControl: false
        }
      };
      $scope.markers = [];
      $scope.markersIds = [];
      // Ready to manipulate map
      GoogleMapApi.then(function (maps) {
        var markers = function (i, insect) {
          var marker = {
              id: insect._id,
              latitude: insect.loc.coordinates[1],
              longitude: insect.loc.coordinates[0],
              options: {
                icon: {
                  url: insect.image.small,
                  scaledSize: new google.maps.Size(50, 50)
                }
              },
              name: insect.name,
              scientificName: insect.scientificName,
              user: insect.user,
              dateFound: insect.dateFound,
              locationTitle: insect.locationTitle
            };
          return marker;
        };
        $scope.$watch(function () {
          return $scope.map.bounds;
        }, function (nv, ov) {
          $scope.loading = true;
          var markersTemp = [], markersIdsTemp = [];
          if (!ov.southwest && nv.southwest || ov.southwest && nv.southwest) {
            var boxBounds = {
                bounds: {
                  southwest: [
                    $scope.map.bounds.southwest.longitude,
                    $scope.map.bounds.southwest.latitude
                  ],
                  northeast: [
                    $scope.map.bounds.northeast.longitude,
                    $scope.map.bounds.northeast.latitude
                  ]
                },
                fetched: JSON.stringify($scope.markersIds),
                limit: 50
              };
            // If finding a user's insects
            if ($stateParams.hasOwnProperty('userId'))
              boxBounds.userId = $stateParams.userId;
            Insects.query(boxBounds, function (insects) {
              for (var i = 0; i < insects.length; i++) {
                // throw out duplicates already on map
                if ($scope.markersIds.indexOf(insects[i]._id) === -1) {
                  markersTemp.push(markers(i, insects[i]));
                  markersIdsTemp.push(insects[i]._id);
                }
              }
              $scope.markers = $scope.markers.concat(markersTemp);
              $scope.markersIds = $scope.markersIds.concat(markersIdsTemp);
              $scope.loading = false;
            });
          }
        }, true);
      });
    };
  }
]);'use strict';
angular.module('insects').directive('validFile', [function () {
    return {
      require: 'ngModel',
      link: function postLink(scope, element, attrs, ngModel) {
        element.bind('change', function () {
          scope.$apply(function () {
            ngModel.$setViewValue(element.val());
            ngModel.$render();
          });
        });
      }
    };
  }]);'use strict';
//Insects service used for communicating with the insects REST endpoints
angular.module('insects').factory('Insects', [
  '$resource',
  function ($resource) {
    return $resource('insects/:insectId', { insectId: '@_id' }, { update: { method: 'PUT' } });
  }
]);'use strict';
// Configuring the Notes module
angular.module('notes').run([
  'Menus',
  function (Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Field Notes', 'notes', 'dropdown', '/notes(/create)?', false, null, 2);
    Menus.addSubMenuItem('topbar', 'notes', 'List Field Notes', 'notes', null, true, null, null, 'See your assignments');
    Menus.addSubMenuItem('topbar', 'notes', 'New Field Note', 'notes/create', null, true, null, null, 'Log your insect collecting');
  }
]);'use strict';
// Setting up route
angular.module('notes').config([
  '$stateProvider',
  function ($stateProvider) {
    // Notes state routing
    $stateProvider.state('listNotes', {
      url: '/notes',
      templateUrl: 'modules/notes/views/list-notes.client.view.html'
    }).state('createNote', {
      url: '/notes/create',
      templateUrl: 'modules/notes/views/create-note.client.view.html'
    }).state('viewNote', {
      url: '/notes/:noteId',
      templateUrl: 'modules/notes/views/view-note.client.view.html'
    }).state('editNote', {
      url: '/notes/:noteId/edit',
      templateUrl: 'modules/notes/views/edit-note.client.view.html'
    });
  }
]);'use strict';
angular.module('notes').controller('NotesController', [
  '$scope',
  '$stateParams',
  '$location',
  'Authentication',
  'Notes',
  'Insects',
  function ($scope, $stateParams, $location, Authentication, Notes, Insects) {
    $scope.authentication = Authentication;
    // If user is not signed in then redirect back home
    //if (!$scope.user) $location.path('/');
    $scope.createPage = function () {
      $scope.insects = [];
      $scope.insects = Insects.query({
        limit: 100,
        userId: Authentication.user._id
      });
    };
    $scope.create = function () {
      var ids = [];
      for (var i = 0; i < this.selectedInsects.length; i++) {
        ids.push(this.selectedInsects[i]._id);
      }
      var note = new Notes({
          title: this.title,
          content: this.content,
          insects: ids
        });
      note.$save(function (response) {
        $location.path('notes/' + response._id);
        $scope.title = '';
        $scope.content = '';
        $scope.selectedInsects = [];
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    $scope.remove = function (note) {
      if (note) {
        note.$remove();
        for (var i in $scope.notes) {
          if ($scope.notes[i] === note) {
            $scope.notes.splice(i, 1);
          }
        }
      } else {
        $scope.note.$remove(function () {
          $location.path('notes');
        });
      }
    };
    $scope.updatePage = function () {
      $scope.insects = [];
      $scope.insects = Insects.query({
        limit: 100,
        userId: Authentication.user._id
      });
    };
    $scope.update = function () {
      var ids = [];
      for (var i = 0; i < this.selectedInsects.length; i++) {
        ids.push(this.selectedInsects[i]._id);
      }
      var note = new Notes({
          _id: $scope.note._id,
          name: $scope.note.title,
          content: $scope.note.content,
          insects: ids
        });
      note.$update(function () {
        $location.path('notes/' + note._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
    $scope.find = function () {
      $scope.loading = true;
      $scope.notes = Notes.query(function () {
        $scope.loading = false;
      });
    };
    $scope.findOne = function () {
      $scope.loading = true;
      $scope.note = Notes.get({ noteId: $stateParams.noteId }, function () {
        $scope.loading = false;
      }, function (err) {
        $scope.error = err.data.message;
        $scope.loading = false;
      });
    };
  }
]);'use strict';
//Notes service used for communicating with the notes REST endpoints
angular.module('notes').factory('Notes', [
  '$resource',
  function ($resource) {
    return $resource('notes/:noteId', { noteId: '@_id' }, { update: { method: 'PUT' } });
  }
]);'use strict';
// Configuring the menus
angular.module('users').run([
  'Menus',
  function (Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Users', 'users', 'dropdown', '/users(/list)?', false, null, 10);
    Menus.addSubMenuItem('topbar', 'users', 'All Users', 'users/list', null, true, null, null, 'See all bug collectors');
    Menus.addSubMenuItem('topbar', 'users', 'My Profile', 'profile/', null, true, null, null, 'About you');
  }
]);
// Config HTTP Error Handling
angular.module('users').config([
  '$httpProvider',
  function ($httpProvider) {
    // Set the httpProvider "not authorized" interceptor
    $httpProvider.interceptors.push([
      '$q',
      '$location',
      'Authentication',
      function ($q, $location, Authentication) {
        return {
          responseError: function (rejection) {
            switch (rejection.status) {
            case 401:
              // Deauthenticate the global user
              Authentication.user = null;
              // Redirect to signin page
              $location.path('signin');
              break;
            case 403:
              // Add unauthorized behaviour
              break;
            }
            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);'use strict';
// Setting up route
angular.module('users').config([
  '$stateProvider',
  function ($stateProvider) {
    // Users state routing
    $stateProvider.state('editProfile', {
      url: '/settings/profile',
      templateUrl: 'modules/users/views/settings/edit-profile.client.view.html'
    }).state('profile', {
      url: '/profile',
      templateUrl: 'modules/users/views/profile/profile.client.view.html'
    }).state('viewProfile', {
      url: '/profile/:userId',
      templateUrl: 'modules/users/views/profile/profile.client.view.html'
    }).state('listUsers', {
      url: '/users/list',
      templateUrl: 'modules/users/views/profile/list-users.client.view.html'
    }).state('password', {
      url: '/settings/password',
      templateUrl: 'modules/users/views/settings/change-password.client.view.html'
    }).state('signup', {
      url: '/signup',
      templateUrl: 'modules/users/views/authentication/signup.client.view.html'
    }).state('signin', {
      url: '/signin',
      templateUrl: 'modules/users/views/authentication/signin.client.view.html'
    }).state('forgot', {
      url: '/password/forgot',
      templateUrl: 'modules/users/views/password/forgot-password.client.view.html'
    }).state('reset-invlaid', {
      url: '/password/reset/invalid',
      templateUrl: 'modules/users/views/password/reset-password-invalid.client.view.html'
    }).state('reset-success', {
      url: '/password/reset/success',
      templateUrl: 'modules/users/views/password/reset-password-success.client.view.html'
    }).state('reset', {
      url: '/password/reset/:token',
      templateUrl: 'modules/users/views/password/reset-password.client.view.html'
    });
  }
]);'use strict';
angular.module('users').controller('AuthenticationController', [
  '$scope',
  '$http',
  '$location',
  'Authentication',
  function ($scope, $http, $location, Authentication) {
    $scope.authentication = Authentication;
    // If user is signed in then redirect back home
    if ($scope.authentication.user)
      $location.path('/');
    $scope.signup = function () {
      $http.post('/auth/signup', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;
        // And redirect to the index page
        $location.path('/');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
    $scope.signin = function () {
      $http.post('/auth/signin', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;
        // And redirect to the index page
        $location.path('/');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);'use strict';
angular.module('users').controller('PasswordController', [
  '$scope',
  '$stateParams',
  '$http',
  '$location',
  'Authentication',
  function ($scope, $stateParams, $http, $location, Authentication) {
    $scope.authentication = Authentication;
    //If user is signed in then redirect back home
    if ($scope.authentication.user)
      $location.path('/');
    // Submit forgotten password account id
    $scope.askForPasswordReset = function () {
      $scope.success = $scope.error = null;
      $http.post('/auth/forgot', $scope.credentials).success(function (response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;
      }).error(function (response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });
    };
    // Change user password
    $scope.resetUserPassword = function () {
      $scope.success = $scope.error = null;
      $http.post('/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.passwordDetails = null;
        // Attach user profile
        Authentication.user = response;
        // And redirect to the index page
        $location.path('/password/reset/success');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);'use strict';
angular.module('users').controller('ProfileController', [
  '$scope',
  '$http',
  '$stateParams',
  '$location',
  'Users',
  'Collections',
  'Authentication',
  function ($scope, $http, $stateParams, $location, Users, Collections, Authentication) {
    $scope.user = Authentication.user;
    // If user is not signed in then redirect back home
    //if (!$scope.user) $location.path('/');
    $scope.showPath = function (path) {
      $location.path(path);
    };
    $scope.listUsers = function () {
      $http.get('/users/list').success(function (data, status, headers, config) {
        $scope.users = data;
      }).error(function (data, status, headers, config) {
        $scope.error = data.message;
      });
    };
    $scope.findUser = function () {
      $scope.loading = true;
      $scope.collectionsloading = true;
      // If bare URL with no userid, find logged in profile
      var userId = $stateParams.userId;
      if ($stateParams.userId === '')
        userId = Authentication.user._id;
      $scope.foundUser = Users.get({ userId: userId }, function () {
        $scope.loading = false;
      });
      $scope.collections = Collections.query({ userId: userId }, function () {
        $scope.collectionsloading = false;
      });
    };
  }
]);'use strict';
angular.module('users').controller('SettingsController', [
  '$scope',
  '$http',
  '$location',
  'Users',
  'Authentication',
  function ($scope, $http, $location, Users, Authentication) {
    $scope.user = Authentication.user;
    // If user is not signed in then redirect back home
    if (!$scope.user)
      $location.path('/');
    // Update a user profile
    $scope.updateUserProfile = function (isValid) {
      if (isValid) {
        $scope.success = $scope.error = null;
        var user = new Users($scope.user);
        user.$update(function (response) {
          $scope.success = true;
          Authentication.user = response;
          $location.path('/profile/');
        }, function (response) {
          $scope.error = response.data.message;
        });
      } else {
        $scope.submitted = true;
      }
    };
    // Change user password
    $scope.changeUserPassword = function () {
      $scope.success = $scope.error = null;
      $http.post('/users/password', $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.passwordDetails = null;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);'use strict';
// Authentication service for user variables
angular.module('users').factory('Authentication', [function () {
    var _this = this;
    _this._data = { user: window.user };
    return _this._data;
  }]);'use strict';
// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', [
  '$resource',
  function ($resource) {
    return $resource('users/:userId', { insectId: '@_id' }, { update: { method: 'PUT' } });
  }
]);