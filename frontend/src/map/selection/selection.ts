import { ID, SearchResult } from "facilmap-types";
import { DomEvent, LeafletEvent } from "leaflet";
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { InjectMapComponents, InjectMapContext, MapComponents, MapContext } from "../leaflet-map/leaflet-map";
import { isEqual } from "lodash";
import WithRender from "./selection.vue";
import MarkerInfo from "../marker-info/marker-info";
import Client from "facilmap-client";
import { InjectClient } from "../client/client";
import LineInfo from "../line-info/line-info";

export type SelectedItem = {
	type: "marker" | "line";
	id: ID;
} | {
	type: "searchResult";
	result: SearchResult;
}

function byType<T extends SelectedItem["type"]>(items: SelectedItem[], type: T): Array<SelectedItem & { type: T }> {
	return items.filter((i) => i.type === type) as any;
}

@WithRender
@Component({
	components: { LineInfo, MarkerInfo }
})
export default class Selection extends Vue {

	@InjectMapContext() mapContext!: MapContext;
	@InjectMapComponents() mapComponents!: MapComponents;
	@InjectClient() client!: Client;

	created(): void {
		this.mapComponents.markersLayer.on("click", this.handleClickMarker);
		this.mapComponents.linesLayer.on("click", this.handleClickLine);
		this.mapComponents.searchResultsLayer.on("click", this.handleClickSearchResult);
		this.mapComponents.map.on("click", this.handleClickMap);
	}

	beforeDestroy(): void {
		this.mapComponents.markersLayer.off("click", this.handleClickMarker);
		this.mapComponents.linesLayer.off("click", this.handleClickLine);
		this.mapComponents.searchResultsLayer.off("click", this.handleClickSearchResult);
		this.mapComponents.map.off("click", this.handleClickMap);
	}

	get selection(): SelectedItem[] {
		return this.mapContext.selection;
	}

	get title(): string {
		if (this.selection.length == 1) {
			const item = this.selection[0];
			if (item.type == "marker")
				return this.client.markers[item.id]?.name;
			else if (item.type == "line")
				return this.client.lines[item.id]?.name;
			else if (item.type == "searchResult")
				return item.result.display_name;
			else
				return "Selected item";
		} else {
			return `${this.selection.length} selected items`;
		}
	}

	setSelectedItems(items: SelectedItem[]): void {
		if (this.mapContext.selection.length == 0 && items.length > 0) {
			setTimeout(() => {
				this.$root.$emit("fmSearchBoxShowTab", "fm-selection-tab");
			}, 0);
		}

		this.mapContext.selection = items;

		this.mapComponents.markersLayer.setHighlightedMarkers(new Set(
			byType(this.mapContext.selection, "marker").map((i) => i.id)
		));
		this.mapComponents.linesLayer.setHighlightedLines(new Set(
			byType(this.mapContext.selection, "line").map((i) => i.id)
		));
		this.mapComponents.searchResultsLayer.setHighlightedResults(new Set(
			byType(this.mapContext.selection, "searchResult").map((i) => i.result)
		));
	}

	isSelected(item: SelectedItem): boolean {
		return this.mapContext.selection.some((i) => isEqual(i, item));
	}

	selectItem(item: SelectedItem): void {
		if (!this.isSelected(item))
			this.setSelectedItems([...this.mapContext.selection, item]);
	}

	unselectItem(item: SelectedItem): void {
		this.setSelectedItems(this.mapContext.selection.filter((i) => !isEqual(i, item)));
	}

	toggleItem(item: SelectedItem): void {
		if (this.isSelected(item))
			this.unselectItem(item);
		else
			this.selectItem(item);
	}

	handleClickItem(item: SelectedItem, e: LeafletEvent): void {
		DomEvent.stopPropagation(e);
		if ((e.originalEvent as any).ctrlKey || (e.originalEvent as any).shiftKey)
			this.toggleItem(item);
		else
			this.setSelectedItems([item]);
	}

	handleClickMarker(e: LeafletEvent): void {
		if (e.propagatedFrom?.marker?.id)
			this.handleClickItem({ type: "marker", id: e.propagatedFrom.marker.id }, e);
	}

	handleClickLine(e: LeafletEvent): void {
		if (e.propagatedFrom?.line?.id)
			this.handleClickItem({ type: "line", id: e.propagatedFrom.line.id }, e);
	}

	handleClickSearchResult(e: LeafletEvent): void {
		if (e.propagatedFrom?._fmSearchResult)
			this.handleClickItem({ type: "searchResult", result: e.propagatedFrom._fmSearchResult }, e);
	}

	handleClickMap(e: LeafletEvent): void {
		if (!(e.originalEvent as any).ctrlKey && !(e.originalEvent as any).shiftKey)
			this.setSelectedItems([]);
	}

}