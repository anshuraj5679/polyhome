import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

// Fallback for demo mode if keys are missing
const isMock = !supabaseUrl || !supabaseAnonKey;

// Simple LocalStorage Mock for persistence without backend
const mockStorage = {
    get: (table) => {
        const data = localStorage.getItem(`supamock_${table}`);
        return data ? JSON.parse(data) : [];
    },
    set: (table, data) => {
        localStorage.setItem(`supamock_${table}`, JSON.stringify(data));
    }
};

export const supabase = isMock
    ? {
        from: (table) => {
            const getFreshData = () => mockStorage.get(table);

            return {
                select: (columns) => {
                    let filteredData = getFreshData();
                    // Sort by ID desc by default for lists
                    filteredData.sort((a, b) => b.id - a.id);

                    const chain = {
                        eq: (col, val) => {
                            filteredData = filteredData.filter(item => String(item[col]) === String(val));
                            return chain;
                        },
                        single: () => {
                            return Promise.resolve({ data: filteredData[0] || null, error: null });
                        },
                        // Make the chain awaitable to return the data array
                        then: (resolve) => {
                            resolve({ data: filteredData, error: null });
                        }
                    };
                    return chain;
                },
                insert: (rows) => {
                    const current = getFreshData();
                    const newRows = Array.isArray(rows) ? rows : [rows];
                    const updated = [...current, ...newRows];
                    mockStorage.set(table, updated);
                    return Promise.resolve({ data: newRows, error: null });
                },
                update: () => ({ data: [], error: null }),
                delete: () => {
                    return {
                        eq: (col, val) => {
                            const current = getFreshData();
                            const updated = current.filter(item => String(item[col]) !== String(val));
                            mockStorage.set(table, updated);
                            return Promise.resolve({ error: null });
                        }
                    };
                },
            };
        },
        auth: {
            getUser: () => ({ data: { user: null }, error: null }),
            signInWithOAuth: () => { },
            signOut: () => { },
        },
        storage: {
            from: () => ({
                upload: () => ({ data: { path: 'mock-path' }, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: 'https://picsum.photos/800/600' } })
            })
        }
    }
    : createClient(supabaseUrl, supabaseAnonKey)

export const isSupabaseMock = isMock;
