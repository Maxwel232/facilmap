import { Component, Prop, ProvideReactive, Watch } from "vue-property-decorator";
import Vue from "vue";
import Client from "facilmap-client";
import "./client.scss";
import WithRender from "./client.vue";
import { PadId } from "facilmap-types";
import context from "../context";
import PadSettings from "../pad-settings/pad-settings";
import { CLIENT_INJECT_KEY } from "../../utils/decorators";

@WithRender
@Component({
    components: { PadSettings }
})
export class ClientProvider extends Vue {

    @Prop({ type: String, default: "/" }) readonly serverUrl!: string;
    @Prop({ type: String }) readonly padId: string | undefined;

    @ProvideReactive(CLIENT_INJECT_KEY) client: Client = null as any;

    createId: string | null = null;
    connecting = true;

    created(): void {
        const client = new Client(this.serverUrl, this.padId);
        client._set = Vue.set;
        client._delete = Vue.delete;

        client.on("connect", () => {
            this.connecting = false;
        });

        this.client = client;
    }

    beforeDestroy(): void {
        this.client.disconnect();
    }

    get closeHref(): string {
        return context.urlPrefix;
    }

    @Watch("client.padId")
    handlePadIdChange(padId: PadId): void {
        this.$emit("padId", padId);
    }

    @Watch("client.padData.name")
    handlePadNameChange(padName: string): void {
        this.$emit("padName", padName);
    }

    @Watch("client.serverError")
    handleServerErrorChange(serverError: Error | undefined): void {
        if (serverError?.message?.includes("does not exist") && context.interactive) {
            this.client.serverError = undefined;
            this.createId = context.activePadId;
            setTimeout(() => {
                this.$bvModal.show("fm-client-create-pad");
            }, 0);
        }
    }


}