import React from 'react';
import { FileText } from 'lucide-react';
import CommentableViewer from './components/CommentableViewer';

const sampleContent = `
# 📋 Product Requirements Document

## 🎯 Executive Summary

This document outlines the **key requirements** for our next-generation product development cycle. We're building something **revolutionary** that will transform how users interact with our platform.

> "Innovation distinguishes between a leader and a follower." - Steve Jobs

The following sections detail the technical specifications, user experience considerations, and implementation timeline for our ambitious project.

## ⚡ Technical Specifications

### 🎨 Frontend Requirements

The frontend architecture should leverage **modern React patterns** with TypeScript for type safety. We need to ensure that all components are reusable and follow our established design system.

Key considerations include:

1. **Performance optimization** through intelligent code splitting
2. **Accessibility compliance** with WCAG 2.1 AA standards  
3. **Responsive design** that works seamlessly across all device sizes
4. **Progressive enhancement** for superior user experience
5. **Modern state management** with optimistic updates

### 🏗️ Backend Architecture

Our backend services should be built with **scalability** and **reliability** in mind. The microservices architecture will allow us to:

1. 🚀 **Scale independently** based on real-time demand
2. ⚡ **Deploy faster** with smaller, focused services
3. 🔧 **Maintain easier** codebases with clear boundaries
4. 🛡️ **Recover quickly** from failures through isolation
5. 📊 **Monitor effectively** with distributed tracing

## 🎨 User Experience Guidelines

The user interface should prioritize **clarity and simplicity**. Every interaction should feel natural and intuitive, reducing cognitive load on our users while providing **delightful micro-interactions**.

### 🎯 Design Principles

- ✨ **Minimize friction** to complete common tasks
- 🔄 **Provide clear feedback** for all user actions
- 🎨 **Maintain consistency** across all platforms
- ♿ **Support accessibility** for users with disabilities
- 📱 **Mobile-first approach** with progressive enhancement

## 📅 Implementation Timeline

The project will be executed in **three strategic phases**:

### 🏗️ **Phase 1** (Months 1-2): Foundation and Core Infrastructure
- Set up development environment and CI/CD pipelines
- Implement core authentication and authorization systems
- Establish monitoring and logging infrastructure

### 🚀 **Phase 2** (Months 3-4): Feature Development and Integration
- Build core user-facing features
- Implement real-time collaboration tools
- Integrate third-party services and APIs

### 🎯 **Phase 3** (Months 5-6): Testing, Optimization, and Deployment
- Comprehensive testing across all platforms
- Performance optimization and security audits
- Staged deployment with monitoring

Each phase includes **comprehensive testing** and quality assurance checkpoints to ensure we meet our high standards for reliability and performance.

## 🎉 Conclusion

This comprehensive approach will ensure we deliver a product that not only meets but exceeds user expectations while maintaining our commitment to technical excellence and innovation.

---

*This document is a living specification that will evolve as we learn more about our users' needs and technical constraints.*
`;

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
            Collaborative Document Review
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Select any text to add comments and collaborate seamlessly on documents with your team
          </p>
        </div>
        
        <CommentableViewer content={sampleContent} />
      </div>
    </div>
  );
}

export default App;