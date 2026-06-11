/**
 * Plugin configuration.
 */
export default {
    /**
     * Custom element prefix, must be unique
     */
    ce_prefix: 'testytester',
    identifier: 'cidr.techyt.adaptivecolors',
    name: 'Adaptive Colors',
    description: 'Adapts accent colors based on album art.',
    version: '1.0.0',
    pluginKitVersion: '4.0.0',
    author: 'TechyTechster',
    repo: 'https://github.com/TechyTechster/adaptivecolors',
    entry: {
        'plugin.js': {
            type: 'main',
        }
    }
}