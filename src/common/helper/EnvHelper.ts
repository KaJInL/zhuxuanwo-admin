
export default new class {
    public env = {} as ImportMetaEnv

    constructor() {
        this.env = this.getEnv()
    }

    private getEnv(): ImportMetaEnv {
        const envs: any = {}
        Object.entries(import.meta.env as Record<string, string>).forEach(([key, value]) => {
            if (value == 'true' || value == 'false') {
                envs[key] = value === 'true'
            }else   if (/^\d+$/.test(value)) {
                envs[key] = parseInt(value)
            }else  if (value == 'null') {
                envs[key] = null
            }else if (value == 'undefined') {
                envs[key] = undefined
            }else {
                envs[key] = value
            }

        })
        return envs
    }

}