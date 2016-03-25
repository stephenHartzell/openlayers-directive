angular.module('openlayers-directive').directive('olPath', function($log, $q, olMapDefaults, olHelpers) {

    return {
        restrict: 'E',
        scope: {
            properties: '=olGeomProperties'
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

            olScope.getMap().then(function(map) {
                var mapDefaults = olMapDefaults.getDefaults(olScope);
                var viewProjection = mapDefaults.view.projection;
                var layer = createVectorLayer();
                var layerCollection = map.getLayers();
                var label;
                var feature;
                var extent;
                var data = {};

                insertLayer(layerCollection, layerCollection.getLength(), layer);

                scope.$on('$destroy', function() {
                    removeLayer(layerCollection, layer.index);
                });

                if (!isDefined(scope.properties) && isDefined(attrs.coords) && isDefined(attrs.olType)) {
                    var proj = attrs.proj || 'EPSG:4326';
                    var coords = JSON.parse(attrs.coords);
                    var type = attrs.olType;
                    data = {
                        type: type,
                        coords: coords,
                        projection: proj,
                        style: mapDefaults.styles.path
                    };
                    feature = createFeature(data, viewProjection);
                    layer.getSource().addFeature(feature);

                    if (attrs.message) {
                        scope.message = attrs.message;
                        extent = feature.getGeometry().getExtent();
                        label = createOverlay(element, extent);
                        map.addOverlay(label);
                    }
                    return;
                }

                scope.$watch('properties', function(properties) {

                    // Remove previous listeners if any
                    map.getViewport().removeEventListener('mousemove', properties.handleInteraction);

                    properties.handleInteraction = function(evt) {
                        var found = false;
                        var pixel = map.getEventPixel(evt);
                        var detectedFeature = map.forEachFeatureAtPixel(pixel, function(feature) {
                            return feature;
                        });

                        var actionTaken = false;
                        if (detectedFeature === feature && scope.message) {
                            actionTaken = true;
                            found = true;
                            if(!isDefined(label)) {
                                extent = detectedFeature.getGeometry().getExtent();
                                label = createOverlay(element, extent);
                                map.addOverlay(label);
                            }
                            map.getTarget().style.cursor = 'pointer';
                        }

                        if (!found && label) {
                            actionTaken = true;
                            map.removeOverlay(label);
                            label = undefined;
                            map.getTarget().style.cursor = '';
                        }

                        if (actionTaken) {
                            evt.preventDefault();
                        }
                    };

                    if (!isDefined(feature)) {
                        data.projection = properties.projection ? properties.projection : 'EPSG:4326';
                        data.coords = properties.coords ? properties.coords : data.coords;
                        data.type = attrs.olType;

                        if (isDefined(properties.style)) {
                            data.style = properties.style;
                        } else {
                            data.style = mapDefaults.styles.path;
                        }

                        feature = createFeature(data, viewProjection);
                        if (!isDefined(feature)) {
                            $log.error('[AngularJS - Openlayers] Received invalid data on ' +
                                'the path.');
                        }
                        // Add a link between the feature and the marker properties
                        feature.set('path', properties);
                        layer.getSource().addFeature(feature);
                    }

                    if (isDefined(label)) {
                        map.removeOverlay(label);
                    }

                    if (!isDefined(properties.label)) {
                        return;
                    }

                    scope.message = properties.label.message;
                    if (!isDefined(scope.message) || scope.message.length === 0) {
                        return;
                    }

                    if (properties.label && properties.label.show === true) {
                        extent = feature.getGeometry().getExtent();
                        label = createOverlay(element, extent);
                        map.addOverlay(label);
                    }

                    if (label && properties.label && properties.label.show === false) {
                        map.removeOverlay(label);
                        label = undefined;
                    }

                    // Then setup new ones according to properties
                    if (properties.label && properties.label.show === false && properties.label.showOnMouseOver) {
                        map.getViewport().addEventListener('mousemove', properties.handleInteraction);
                    }
                }, true);
            });
        }
    };
});
