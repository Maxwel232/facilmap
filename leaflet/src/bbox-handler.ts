import Client, { ClientEvents } from "facilmap-client";
import { EventHandler } from "facilmap-types";
import { Handler, LatLngBounds, Map } from "leaflet";
import { leafletToFmBbox } from "./utils/leaflet";

const flyToBkp = Map.prototype.flyTo;
Map.prototype.flyTo = function(...args) {
    const [latlng, zoom] = args;
    this.fire("fmFlyTo", { latlng, zoom });
    return flyToBkp.apply(this, args);
};

export default class BboxHandler extends Handler {

    client: Client;

    constructor(map: Map, client: Client) {
        super(map);
        this.client = client;
    }

    updateBbox(bounds?: LatLngBounds, zoom?: number): void {
        if (this._map._loaded)
            this.client.updateBbox(leafletToFmBbox(bounds ?? this._map.getBounds(), zoom ?? this._map.getZoom()));
    }

    handleMoveEnd = (): void => {
        if (this.client.padId || this.client.route) {
            this.updateBbox();
        }
    }

    handleFlyTo = ({ latlng, zoom }: any): void => {
        const pixelBounds = this._map.getPixelBounds(latlng, zoom);
        const bounds = new LatLngBounds(this._map.unproject(pixelBounds.getBottomLeft(), zoom), this._map.unproject(pixelBounds.getTopRight(), zoom));
        this.updateBbox(bounds, zoom);
    }

    handleEmit: EventHandler<ClientEvents, "emit"> = (name, data) => {
        if (["setPadId", "setRoute"].includes(name)) {
            this.updateBbox();
        }
    }

    addHooks(): void {
        this._map.on("moveend", this.handleMoveEnd);
        this._map.on("fmFlyTo", this.handleFlyTo);
        this.client.on("emit", this.handleEmit);
    }

    removeHooks(): void {
        this._map.off("moveend", this.handleMoveEnd);
        this._map.off("fmFlyTo", this.handleFlyTo);
        this.client.removeListener("emit", this.handleEmit);
    }
}