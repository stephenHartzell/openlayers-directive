angular.module('openlayers-directive').directive('olPath', function($log, $q, olMapDefaults, olHelpers) {

    return {
        restrict: 'E',
        scope: {
            properties: '=olGeomProperties',
            showMessageOnMouseOver: '=showMessageOnMouseOver',
            showMessage: '=showMessage'
        },
        require: '^openlayers',
        replace: true,
        template: '<div class="popup-label path" ng-bind-html="message"></div>',

        link: function(scope, element, attrs, controller) {
            var isDefined = olHelpers.isDefined;
            var createFeature = olHelpers.createFeature;
            var createOverlay = olHelpers.createOverlay;
            var createVectorLayer = olHelpers.createVectorLayer;
            var insertLayer = olHelpers.insertLayer;
            var removeLayer = olHelpers.removeLayer;
            var olScope = controller.getOpenlayersScope();
            var label;
            scope.attrs = attrs;

            olScope.getMap().then(function(map) {
                var mapDefaults = olMapDefaults.getDefaults(olScope);
                var viewProjection = mapDefaults.view.projection;

                var layer = createVectorLayer();
                var layerCollection = map.getLayers();

                insertLayer(layerCollection, layerCollection.getLength(), layer);

                scope.$on('$destroy', function() {
                    removeLayer(layerCollection, layer.index);
                });

                if (isDefined(attrs.coords) && isDefined(attrs.olType)) {
                    var proj = attrs.proj || 'EPSG:4326';
                    var coords = JSON.parse(attrs.coords);
                    var type = attrs.olType;
                    var data = {
                        type: type,
                        coords: coords,
                        projection: proj,
                        style: mapDefaults.styles.path
                    };
                    var feature = createFeature(data, viewProjection);
                    layer.getSource().addFeature(feature);

                    // This function handles popup on mouse over
                    handleInteraction = function(evt) {
                        var found = false;
                        var pixel = map.getEventPixel(evt);
                        var detectedFeature = map.forEachFeatureAtPixel(pixel, function(feature) {
                            return feature;
                        });

                        var actionTaken = false;
                        if (detectedFeature === feature && scope.message) {
                            actionTaken = true;
                            found = true;
                            var extent = detectedFeature.getGeometry().getExtent();
                            label = createOverlay(element, extent);
                            map.addOverlay(label);
                            map.getTarget().style.cursor = 'pointer';
                        }

                        if (!found && label) {
                            actionTaken = true;
                            map.removeOverlay(label);
                            map.getTarget().style.cursor = '';
                        }

                        if (actionTaken) {
                            evt.preventDefault();
                        }
                    };

                    if (attrs.hasOwnProperty('message')) {
                        scope.$watch('attrs.message', function (newMessage, oldMessage) {
                            scope.message = newMessage;
                            if(!oldMessage){
                                if(scope.showMessage){
                                    map.addOverlay(label);
                                }
                            }
                            if(!newMessage){
                                if(scope.showMessage){
                                    map.removeOverlay(label);
                                }
                            }
                        });

                        var extent = feature.getGeometry().getExtent();
                        label = createOverlay(element, extent);
                        if (attrs.hasOwnProperty('showMessage')) {
                            scope.$watch('showMessage', function (show) {
                                if(!scope.message) return;
                                if (show) {
                                    map.getViewport().removeEventListener('mousemove', handleInteraction);
                                    map.addOverlay(label);
                                } else {
                                    if (scope.showOnMouseOver) {
                                        map.getViewport().addEventListener('mousemove', handleInteraction);
                                    }
                                    map.removeOverlay(label);
                                }
                            });
                        }

                        if (attrs.hasOwnProperty('showMessageOnMouseOver')) {
                            scope.$watch('showMessageOnMouseOver', function (hover) {
                                if (hover && !scope.show) {
                                    map.getViewport().removeEventListener('mousemove', handleInteraction);
                                    map.getViewport().addEventListener('mousemove', handleInteraction);
                                } else {
                                    map.getViewport().removeEventListener('mousemove', handleInteraction);
                                }
                            });
                        }
                    }
                    return;
                }
            });
        }
    };
});
