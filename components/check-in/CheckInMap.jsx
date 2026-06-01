import { Platform } from "react-native";

import CheckInMapNative from "./CheckInMap.native";
import CheckInMapWeb from "./CheckInMap.web";

export default Platform.OS === "web" ? CheckInMapWeb : CheckInMapNative;
