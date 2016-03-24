angular.module('openlayers-directive', ['ngSanitize']).directive('openlayers', function($log, $q, $compile, olHelpers,
        olMapDefaults, olData) {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            scope: {
                center: '=olCenter',
                defaults: '=olDefaults',
                view: '=olView',
                events: '=olEvents',
                interaction: '=olInteraction'
            },
            template: '<div class="angular-openlayers-map" ng-transclude></div>',
            controller: function($scope) {
                var _map = $q.defer();
                $scope.getMap = function() {
                    return _map.promise;
                };

                $scope.setMap = function(map) {
                    _map.resolve(map);
                };

                this.getOpenlayersScope = function() {
                    return $scope;
                };
            },
            link: function(scope, element, attrs) {
                var isDefined = olHelpers.isDefined;
                var createLayer = olHelpers.createLayer;
                var setMapEvents = olHelpers.setMapEvents;
                var setViewEvents = olHelpers.setViewEvents;
                var createView = olHelpers.createView;
                var defaults = olMapDefaults.setDefaults(scope);
                var drawInteraction;

                // Set width and height if they are defined
                if (isDefined(attrs.width)) {
                    if (isNaN(attrs.width)) {
                        element.css('width', attrs.width);
                    } else {
                        element.css('width', attrs.width + 'px');
                    }
                }

                if (isDefined(attrs.height)) {
                    if (isNaN(attrs.height)) {
                        element.css('height', attrs.height);
                    } else {
                        element.css('height', attrs.height + 'px');
                    }
                }

                if (isDefined(attrs.lat)) {
                    defaults.center.lat = parseFloat(attrs.lat);
                }

                if (isDefined(attrs.lon)) {
                    defaults.center.lon = parseFloat(attrs.lon);
                }

                if (isDefined(attrs.zoom)) {
                    defaults.center.zoom = parseFloat(attrs.zoom);
                }

                var controls = ol.control.defaults(defaults.controls);
                var interactions = ol.interaction.defaults(defaults.interactions);
                var view = createView(defaults.view);

                // Create the Openlayers Map Object with the options
                var map = new ol.Map({
                    target: element[0],
                    controls: controls,
                    interactions: interactions,
                    renderer: defaults.renderer,
                    view: view
                });

                scope.$on('$destroy', function() {
                    olData.resetMap(attrs.id);
                });

                // If no layer is defined, set the default tileLayer
                if (!attrs.customLayers) {
                    var l = {
                        type: 'Tile',
                        source: {
                            type: 'OSM'
                        }
                    };
                    var layer = createLayer(l, view.getProjection(), 'default');
                    map.addLayer(layer);
                    map.set('default', true);
                }

                if (!isDefined(attrs.olCenter)) {
                    var c = ol.proj.transform([defaults.center.lon,
                            defaults.center.lat
                        ],
                        defaults.center.projection, view.getProjection()
                    );
                    view.setCenter(c);
                    view.setZoom(defaults.center.zoom);
                }

                // Set the Default events for the map
                setMapEvents(defaults.events, map, scope);

                // Set the Default events for the map view
                setViewEvents(defaults.events, map, scope);

                // Add layer for draw interactions
                var drawFeatures = new ol.Collection();
                var drawVectorLayer = new ol.layer.Vector({
                    source: new ol.source.Vector({features: drawFeatures}),
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#ffcc33',
                            width: 2
                        }),
                        image: new ol.style.Circle({
                            radius: 7,
                            fill: new ol.style.Fill({
                                color: '#ffcc33'
                            })
                        })
                    })
                });
                map.addLayer(drawVectorLayer);
                var modify = new ol.interaction.Modify({
                    features: drawFeatures,
                    // the SHIFT key must be pressed to delete vertices, so
                    // that new vertices can be drawn at the same position
                    // of existing vertices
                    deleteCondition: function (event)
                    {
                        return ol.events.condition.shiftKeyOnly(event) &&
                            ol.events.condition.singleClick(event);
                    }
                });
                map.addInteraction(modify);

                scope.$watch('interaction', function(interaction) {
                  if(angular.isUndefined(interaction) || interaction == null){
                      if(drawInteraction){
                          map.removeInteraction(drawInteraction);
                      }
                      return;
                  }

                  map.removeInteraction(drawInteraction);
                  var newDrawInteraction = new ol.interaction.Draw({
                      features: drawFeatures,
                      type: interaction.type
                  });
                  drawInteraction = newDrawInteraction;
                  map.addInteraction(drawInteraction);
                });

                // Resolve the map object to the promises
                scope.setMap(map);
                olData.setMap(map, attrs.id);
            }
        };
    });
