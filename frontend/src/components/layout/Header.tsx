import React from 'react'

export default function Header() {
    return (
        <header className="flex items-center justify-between py-4 px-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">🍫 SnackSmith</h1>
            <div className="space-x-4">
                <button className="btn-primary">Save</button>
                <button className="btn-secondary">Share</button>
            </div>
        </header>
    )
}
