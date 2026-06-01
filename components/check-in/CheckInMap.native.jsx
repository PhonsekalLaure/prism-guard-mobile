import MapView, { Circle, Marker } from "react-native-maps";

export default function CheckInMap({
  style,
  region,
  post,
  guardCoords,
  circleFill,
  circleColor,
  isInside,
}) {
  return (
    <MapView
      style={style}
      region={region}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      <Circle
        center={{ latitude: post.latitude, longitude: post.longitude }}
        radius={post.geofence_radius_meters}
        fillColor={circleFill}
        strokeColor={circleColor}
        strokeWidth={2}
      />
      <Marker
        coordinate={{ latitude: post.latitude, longitude: post.longitude }}
        title={post.site_name}
        pinColor="green"
      />
      <Marker
        coordinate={guardCoords}
        title="Your Location"
        pinColor={isInside ? "blue" : "red"}
      />
    </MapView>
  );
}
