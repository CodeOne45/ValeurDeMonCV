import React from 'react';
import styles from '../styles/ResumeWorth.module.css';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface ResumeWorthProps {
  resumeWorth: string;
}

const ResumeWorth: React.FC<ResumeWorthProps> = ({ resumeWorth }) => {
  // Extract the estimated worth, explanation, and improvements from the analysis result
  //  if there are "..." in the <Estimated Worth> tag remove them and add € if it is not there already
  const estimatedWorthMatch = resumeWorth.match(/<Estimated Worth>([\s\S]*?)<\/Estimated Worth>/);
  let estimatedWorthValue = estimatedWorthMatch ? estimatedWorthMatch[1] : 'N/A';
  estimatedWorthValue = estimatedWorthValue.replace('...', '');
  if (!estimatedWorthValue.includes('€')) {
    estimatedWorthValue += ' €';
  }
  //else if the € is at the beginning of the string, remove it and add it at the end
  else if (estimatedWorthValue.startsWith('€')) {
    estimatedWorthValue = estimatedWorthValue.slice(1) + ' €';
  }
  const explanationMatch = resumeWorth.match(/<Explanation>([\s\S]*?)<\/Explanation>/);
  const improvementsMatch = resumeWorth.match(/<Improvements>([\s\S]*?)<\/Improvements>/);

  const explanation = explanationMatch ? explanationMatch[1] : '';
  const improvements = improvementsMatch ? improvementsMatch[1] : '';

  // Extract the list items from the explanation and improvements
  const explanationItems = explanation.match(/<li>(.+?)<\/li>/g);
  const improvementItems = improvements.match(/<li>(.+?)<\/li>/g);

  return (
    <div className={styles.container}>
      <div className={styles.worth}>{estimatedWorthValue}</div>
      <p className="sm:text-xl text-2xl max-w-1xl font-bold text-slate-900 pb-8">Estimation de votre valeur sur le marché</p>
      
      <div className={styles.content}>
        <div className={styles.column}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Facteurs clés</CardTitle>
              <CardDescription>Qu'est-ce qui contribue à votre valeur</CardDescription>
            </CardHeader>
            <CardContent>
              {explanationItems && (
                <ul className={styles.list}>
                  {explanationItems.map((item, index) => (
                    <li key={index} className={styles.listItem}>
                      {item.replace(/<\/?li>/g, '')}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <div className={styles.column}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Améliorations</CardTitle>
              <CardDescription>Comment valoir plus</CardDescription>
            </CardHeader>
            <CardContent>
              {improvementItems && (
                <ul className={styles.list}>
                  {improvementItems.map((item, index) => (
                    <li key={index} className={styles.listItem}>
                      {item.replace(/<\/?li>/g, '')}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResumeWorth;