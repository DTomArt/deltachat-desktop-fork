pipeline {
    agent any

    stages {
        stage('Test') {
            steps {
                echo 'Testing..'
                sh 'docker-compose build'
				sh 'docker-compose up'
            }
            post {
                success {
                    echo 'Testing completed successfully!'
                }
                failure {
                    echo 'Error in testing!'
                    sh 'false'
                }
            }
        }
    }
}