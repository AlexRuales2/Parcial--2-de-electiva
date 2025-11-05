import React from 'react'
import { ProjectProvider } from './store/ProjectContext'
import TeamRegister from './components/TeamRegister'
import ProjectBoard from './components/ProjectBoard'
import './index.css'

export default function App() {
  return (
    <ProjectProvider>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Project Budget Manager
            </h1>
            <p className="text-lg text-gray-600">
              Gestiona tus proyectos y equipos de manera eficiente
            </p>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <TeamRegister />
            </div>

            <div className="lg:col-span-8">
              <ProjectBoard />
            </div>
          </section>
        </div>
      </div>
    </ProjectProvider>
  )
}
