export class SaveSystem {
    private static readonly KEY = 'TANKEEL_SECURE_SAVE_DATA';
    
    // Base64 encoding mock for "encryption" to satisfy the thematic request
    private static encrypt(data: any): string {
        try {
            return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        } catch {
            return btoa(JSON.stringify(data));
        }
    }

    private static decrypt(hash: string): any {
        try {
            return JSON.parse(decodeURIComponent(escape(atob(hash))));
        } catch {
            return JSON.parse(atob(hash));
        }
    }

    static save(data: { isActivated?: boolean; totalFires?: number; highScore?: number; runtime?: number; }) {
        const existing = this.load();
        const merged = { ...existing, ...data };
        localStorage.setItem(this.KEY, this.encrypt(merged));
    }

    static load(): { isActivated: boolean; totalFires: number; highScore: number; runtime: number; } {
        const saved = localStorage.getItem(this.KEY);
        if (saved) {
            try {
                return this.decrypt(saved);
            } catch (e) {
                console.error("Corruption detected", e);
            }
        }
        return { isActivated: false, totalFires: 0, highScore: 0, runtime: 0 };
    }
}
