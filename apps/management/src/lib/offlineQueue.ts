interface QueuedItem {
    id: string
    table: string
    payload: Record<string, unknown>
    createdAt: number
}

const STORAGE_KEY = 'PT_JEEP_OFFLINE_QUEUE'

export const offlineQueue = {
    enqueue(table: string, payload: Record<string, unknown>) {
        const queue = this.getQueue()
        const item: QueuedItem = {
            id: crypto.randomUUID(),
            table,
            payload,
            createdAt: Date.now(),
        }
        queue.push(item)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
        return item
    },

    getQueue(): QueuedItem[] {
        if (typeof window === 'undefined') return []
        try {
            const data = localStorage.getItem(STORAGE_KEY)
            return data ? JSON.parse(data) : []
        } catch {
            return []
        }
    },

    clear() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
        }
    },
}