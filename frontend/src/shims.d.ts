declare module "*.vue" {
    import Vue, { ComponentOptions, FunctionalComponentOptions } from 'vue';

    interface WithRender {
        <V extends Vue, U extends ComponentOptions<V> | FunctionalComponentOptions>(options: U): U
        <V extends typeof Vue>(component: V): V
    }
    const withRender: WithRender;
    export default withRender;
}

declare module "vue-color" {
    export const ColorMixin: any;
    export const Hue: any;
    export const Saturation: any;
}